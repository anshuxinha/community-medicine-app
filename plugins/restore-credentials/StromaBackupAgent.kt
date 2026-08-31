package com.communitymed.app

import android.app.backup.BackupAgent
import android.app.backup.BackupDataInput
import android.app.backup.BackupDataOutput
import android.content.Context
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetRestoreCredentialOption
import androidx.credentials.RestoreCredential
import androidx.credentials.exceptions.GetCredentialException
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * After Android Auto Backup restore, fetch a restore key so the user can be
 * signed in on first launch (and so JS can treat this as a device transfer).
 */
class StromaBackupAgent : BackupAgent() {
    override fun onBackup(
        oldState: ParcelFileDescriptor?,
        data: BackupDataOutput?,
        newState: ParcelFileDescriptor?,
    ) {
        // Auto Backup owns app data. Key-value backup is unused.
    }

    override fun onRestore(
        data: BackupDataInput?,
        appVersionCode: Int,
        newState: ParcelFileDescriptor?,
    ) {
        // Auto Backup restore uses onRestoreFinished.
    }

    override fun onRestoreFinished() {
        val prefs = getSharedPreferences(
            RestoreCredentialsModule.PREFS,
            Context.MODE_PRIVATE,
        )
        prefs.edit()
            .putBoolean(RestoreCredentialsModule.KEY_APP_DATA_RESTORED, true)
            .apply()

        val latch = CountDownLatch(1)
        executor.execute {
            try {
                val optionsJson = fetchAuthOptions()
                if (optionsJson.isNullOrEmpty()) {
                    latch.countDown()
                    return@execute
                }
                val option = GetRestoreCredentialOption(optionsJson)
                val request = GetCredentialRequest(listOf(option))
                CredentialManager.create(applicationContext).getCredentialAsync(
                    applicationContext,
                    request,
                    CancellationSignal(),
                    executor,
                    object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                        override fun onResult(result: GetCredentialResponse) {
                            val json = (result.credential as? RestoreCredential)
                                ?.authenticationResponseJson
                            if (!json.isNullOrEmpty()) {
                                prefs.edit()
                                    .putString(
                                        RestoreCredentialsModule.KEY_PENDING_ASSERTION,
                                        json,
                                    )
                                    .apply()
                            }
                            latch.countDown()
                        }

                        override fun onError(e: GetCredentialException) {
                            Log.w(TAG, "Restore key fetch failed: ${e.message}")
                            latch.countDown()
                        }
                    },
                )
            } catch (e: Exception) {
                Log.w(TAG, "Restore options fetch failed: ${e.message}")
                latch.countDown()
            }
        }
        try {
            latch.await(8, TimeUnit.SECONDS)
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        }
    }

    private fun fetchAuthOptions(): String? {
        val url = URL(OPTIONS_URL)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 4000
            readTimeout = 4000
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
        }
        try {
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write("{\"data\":{}}")
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val body = BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).use { it.readText() }
            if (code !in 200..299) {
                Log.w(TAG, "Options HTTP $code: $body")
                return null
            }
            val result = JSONObject(body).optJSONObject("result") ?: return null
            return result.optString("requestJson", "")
        } finally {
            conn.disconnect()
        }
    }

    companion object {
        private const val TAG = "StromaBackupAgent"
        private const val OPTIONS_URL =
            "https://us-central1-community-med-app.cloudfunctions.net/getRestoreCredentialOptions"
        private val executor = Executors.newSingleThreadExecutor()
    }
}
