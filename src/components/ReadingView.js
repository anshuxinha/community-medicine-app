import React, { useRef, useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContext } from './../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';

const ReadingView = ({ content, topicId, isBookmarked, onToggleBookmark, isSpeaking, onToggleSpeak }) => {
    const webViewRef = useRef(null);
    const { highlights, saveHighlight } = useContext(AppContext);
    const insets = useSafeAreaInsets();

    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        // Load existing highlights if available, otherwise generate HTML
        if (highlights[topicId]) {
            let loadedHtml = highlights[topicId];
            // Ensure the bookmark icon reflects the current state, even if changed since highlight was saved
            loadedHtml = loadedHtml.replace(
                /<span id="bookmark-icon" class="bookmark-icon material-icons">.*?<\/span>/,
                `<span id="bookmark-icon" class="bookmark-icon material-icons">${isBookmarked ? 'bookmark' : 'bookmark_border'}</span>`
            );
            // Ensure the TTS icon reflects the current state
            loadedHtml = loadedHtml.replace(
                /<span id="tts-icon" class="tts-icon material-icons">.*?<\/span>/,
                `<span id="tts-icon" class="tts-icon material-icons">${isSpeaking ? 'stop' : 'volume_up'}</span>`
            );
            setHtmlContent(loadedHtml);
        } else {
            // Convert markdown-like syntax to HTML for the WebView
            let parsedHtml = content
                .split('\n')
                .map(line => {
                    if (line.startsWith('# ')) return `<h1 class="h1">${line.replace('# ', '')}</h1>`;
                    if (line.startsWith('## ')) return `<h2 class="h2">${line.replace('## ', '')}</h2>`;
                    if (line.startsWith('* ') || line.startsWith('- ')) return `<li class="listItem">${line.replace(/^[\*\-] /, '')}</li>`;
                    if (line.trim() === '') return `<div class="spacing"></div>`;
                    return `<p class="body">${line}</p>`;
                })
                .join('');

            // Wrap in ul if there are list items
            parsedHtml = parsedHtml.replace(/(<li.*<\/li>)+/g, '<ul>$&</ul>');

            const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    body {
                        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        padding: 16px;
                        padding-bottom: 140px;
                        color: #1c1b1f;
                        line-height: 1.6;
                        background-color: #ffffff;
                    }
                    .h1 { color: #6200ee; font-size: 24px; margin-top: 16px; margin-bottom: 8px; padding-right: 110px; }
                    .h2 { color: #333333; font-size: 20px; margin-top: 14px; margin-bottom: 6px; }
                    .body { font-size: 16px; margin: 8px 0; }
                    .listItem { font-size: 16px; margin-left: 8px; margin-bottom: 4px; }
                    .spacing { height: 16px; }
                    mark { border-radius: 2px; padding: 0 2px; }
                    ::selection { background: #b3d4fc; }

                    .bookmark-btn {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 44px;
                        height: 44px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        cursor: pointer;
                        z-index: 100;
                    }
                    .bookmark-icon {
                        font-size: 24px;
                        line-height: 24px;
                        color: #6200ee;
                    }

                    .tts-btn {
                        position: absolute;
                        top: 16px;
                        right: 76px;
                        width: 44px;
                        height: 44px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        cursor: pointer;
                        z-index: 100;
                    }
                    .tts-icon {
                        font-size: 24px;
                        line-height: 24px;
                        color: #6200ee;
                    }
                </style>
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
                <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
                <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
            </head>
            <body>
                <div id="content-container">
                    <div class="bookmark-btn" onclick="toggleBookmark()">
                        <span id="bookmark-icon" class="bookmark-icon material-icons">${isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
                    </div>
                    <div class="tts-btn" onclick="toggleTTS()">
                        <span id="tts-icon" class="tts-icon material-icons">${isSpeaking ? 'stop' : 'volume_up'}</span>
                    </div>
                    
                    <div id="color-picker" style="display: none; position: fixed; bottom: 80px; right: 16px; background: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; border: 1px solid #eee;">
                        <div style="font-weight: bold; margin-bottom: 12px; font-family: sans-serif; text-align: center;">Choose Color</div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <div onclick="highlightSelection('#ffff00')" style="width: 36px; height: 36px; border-radius: 18px; background: #ffff00; cursor: pointer; border: 1px solid #ccc;"></div>
                            <div onclick="highlightSelection('#00ff00')" style="width: 36px; height: 36px; border-radius: 18px; background: #00ff00; cursor: pointer; border: 1px solid #ccc;"></div>
                            <div onclick="highlightSelection('#ffc0cb')" style="width: 36px; height: 36px; border-radius: 18px; background: #ffc0cb; cursor: pointer; border: 1px solid #ccc;"></div>
                            <div onclick="highlightSelection('#00ffff')" style="width: 36px; height: 36px; border-radius: 18px; background: #00ffff; cursor: pointer; border: 1px solid #ccc;"></div>
                        </div>
                        <div onclick="document.getElementById('color-picker').style.display = 'none';" style="margin-top: 12px; text-align: center; color: #6200ee; cursor: pointer; font-weight: bold; font-family: sans-serif;">Cancel</div>
                    </div>

                    ${parsedHtml}
                </div>
                <script>
                    function toggleBookmark() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_BOOKMARK' }));
                    }
                    function toggleTTS() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_TTS' }));
                    }
                    function highlightSelection(color) {
                        const selection = window.getSelection();
                        if (!selection.rangeCount || selection.isCollapsed) {
                            // Close picker if nothing selected
                            document.getElementById('color-picker').style.display = 'none';
                            return "";
                        }
                        
                        const range = selection.getRangeAt(0);
                        const mark = document.createElement("mark");
                        mark.style.backgroundColor = color;
                        
                        try {
                            range.surroundContents(mark);
                        } catch(e) {
                            // If selection crosses block elements, surroundContents fails
                            // A more robust implementation is needed for complex selections, 
                            // but this handles simple text highlights gracefully
                            console.log("Cross-block selection not supported yet");
                        }
                        
                        selection.removeAllRanges();
                        
                        // Send updated HTML back to React Native
                        const currentHtml = document.getElementById("content-container").innerHTML;
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HIGHLIGHT_SAVED', html: currentHtml }));
                        
                        // Close picker
                        document.getElementById('color-picker').style.display = 'none';
                    }
                    
                    document.addEventListener("message", function(event) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.action === "highlight") highlightSelection(data.color);
                            if (data.action === "updateBookmark") {
                                document.getElementById("bookmark-icon").innerText = data.isBookmarked ? 'bookmark' : 'bookmark_border';
                            }
                            if (data.action === "updateTTS") {
                                document.getElementById("tts-icon").innerText = data.isSpeaking ? 'stop' : 'volume_up';
                            }
                        } catch(e) {}
                    });
                     // For iOS WKWebView
                    window.addEventListener("message", function(event) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.action === "highlight") highlightSelection(data.color);
                            if (data.action === "togglePicker") {
                                const picker = document.getElementById('color-picker');
                                picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
                            }
                            if (data.action === "updateBookmark") {
                                document.getElementById("bookmark-icon").innerText = data.isBookmarked ? 'bookmark' : 'bookmark_border';
                            }
                            if (data.action === "updateTTS") {
                                document.getElementById("tts-icon").innerText = data.isSpeaking ? 'stop' : 'volume_up';
                            }
                        } catch(e) {}
                    });
                </script>
            </body>
            </html>
            `;
            setHtmlContent(fullHtml);
        }
    }, [content, topicId]);

    // Send an update message to the WebView whenever the isBookmarked prop changes
    useEffect(() => {
        if (webViewRef.current && htmlContent) {
            webViewRef.current.postMessage(JSON.stringify({ action: "updateBookmark", isBookmarked }));
        }
    }, [isBookmarked]);

    // Send an update message to the WebView whenever the isSpeaking prop changes
    useEffect(() => {
        if (webViewRef.current && htmlContent) {
            webViewRef.current.postMessage(JSON.stringify({ action: "updateTTS", isSpeaking }));
        }
    }, [isSpeaking]);

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'HIGHLIGHT_SAVED') {
                // We recreate the full HTML structure with the new innerHTML
                const newFullHtml = htmlContent.replace(/<div id="content-container">[\s\S]*?<\/div>/, `<div id="content-container">${data.html}</div>`);
                setHtmlContent(newFullHtml);
                saveHighlight(topicId, newFullHtml);
            } else if (data.type === 'TOGGLE_BOOKMARK') {
                if (onToggleBookmark) onToggleBookmark();
            } else if (data.type === 'TOGGLE_TTS') {
                if (onToggleSpeak) onToggleSpeak();
            }
        } catch (e) {
            console.error("Error parsing webview message", e);
        }
    };

    const applyHighlight = (color) => {
        // Obsolete function. Handled inside webview.
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

            <TouchableOpacity
                style={[styles.highlightBtn, { bottom: Math.max(16, insets.bottom + 16) }]}
                onPress={() => {
                    if (webViewRef.current) {
                        webViewRef.current.postMessage(JSON.stringify({ action: "togglePicker" }));
                    }
                }}
            >
                <MaterialIcons name="brush" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 2,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    highlightBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#6200ee',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    btnText: {
        fontSize: 24,
    }
});

export default ReadingView;
