package com.communitymed.app

import android.content.Context
import android.os.CancellationSignal
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CreateRestoreCredentialRequest
import androidx.credentials.CreateRestoreCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetRestoreCredentialOption
import androidx.credentials.RestoreCredential
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.credentials.exceptions.restorecredential.E2eeUnavailableException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.Executors

class RestoreCredentialsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()

    override fun getName(): String = "RestoreCredentials"

    private fun manager(): CredentialManager =
        CredentialManager.create(reactContext.applicationContext)

    private fun prefs() =
        reactContext.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @ReactMethod
    fun createRestoreKey(requestJson: String, promise: Promise) {
        createRestoreKeyInternal(requestJson, true, promise)
    }

    private fun createRestoreKeyInternal(
        requestJson: String,
        cloudBackup: Boolean,
        promise: Promise,
    ) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        val request = CreateRestoreCredentialRequest(requestJson, cloudBackup)
        manager().createCredentialAsync(
            activity,
            request,
            CancellationSignal(),
            executor,
            object : CredentialManagerCallback<
                androidx.credentials.CreateCredentialResponse,
                CreateCredentialException,
                > {
                override fun onResult(result: androidx.credentials.CreateCredentialResponse) {
                    val json = (result as? CreateRestoreCredentialResponse)?.responseJson
                    if (json.isNullOrEmpty()) {
                        promise.reject("EMPTY", "Empty restore credential response")
                    } else {
                        promise.resolve(json)
                    }
                }

                override fun onError(e: CreateCredentialException) {
                    if (cloudBackup && e is E2eeUnavailableException) {
                        createRestoreKeyInternal(requestJson, false, promise)
                        return
                    }
                    promise.reject(e.javaClass.simpleName, e.message, e)
                }
            },
        )
    }

    @ReactMethod
    fun getRestoreKey(requestJson: String, promise: Promise) {
        val context = reactContext.currentActivity ?: reactContext.applicationContext
        val option = GetRestoreCredentialOption(requestJson)
        val request = GetCredentialRequest(listOf(option))
        manager().getCredentialAsync(
            context,
            request,
            CancellationSignal(),
            executor,
            object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                override fun onResult(result: GetCredentialResponse) {
                    val restore = result.credential as? RestoreCredential
                    val json = restore?.authenticationResponseJson
                    if (json.isNullOrEmpty()) {
                        promise.resolve(null)
                    } else {
                        promise.resolve(json)
                    }
                }

                override fun onError(e: GetCredentialException) {
                    if (e is NoCredentialException) {
                        promise.resolve(null)
                    } else {
                        promise.reject(e.javaClass.simpleName, e.message, e)
                    }
                }
            },
        )
    }

    @ReactMethod
    fun clearRestoreKey(promise: Promise) {
        val request = ClearCredentialStateRequest(
            ClearCredentialStateRequest.TYPE_CLEAR_RESTORE_CREDENTIAL,
        )
        manager().clearCredentialStateAsync(
            request,
            CancellationSignal(),
            executor,
            object : CredentialManagerCallback<Void?, ClearCredentialException> {
                override fun onResult(result: Void?) {
                    prefs().edit()
                        .remove(KEY_PENDING_ASSERTION)
                        .remove(KEY_APP_DATA_RESTORED)
                        .apply()
                    promise.resolve(true)
                }

                override fun onError(e: ClearCredentialException) {
                    promise.reject(e.javaClass.simpleName, e.message, e)
                }
            },
        )
    }

    @ReactMethod
    fun consumePendingRestoreAssertion(promise: Promise) {
        val stored = prefs().getString(KEY_PENDING_ASSERTION, null)
        if (!stored.isNullOrEmpty()) {
            prefs().edit().remove(KEY_PENDING_ASSERTION).apply()
        }
        promise.resolve(stored)
    }

    @ReactMethod
    fun consumeAppDataRestoredFlag(promise: Promise) {
        val restored = prefs().getBoolean(KEY_APP_DATA_RESTORED, false)
        if (restored) {
            prefs().edit().remove(KEY_APP_DATA_RESTORED).apply()
        }
        promise.resolve(restored)
    }

    companion object {
        const val PREFS = "stroma_restore_credentials"
        const val KEY_PENDING_ASSERTION = "pending_restore_assertion"
        const val KEY_APP_DATA_RESTORED = "app_data_restored"
    }
}
