import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface ChatbotProps {
  visible: boolean;
  onClose: () => void;
}

export default function Chatbot({ visible, onClose }: ChatbotProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleFallbackFormSubmit = (data: { name: string; email: string; message: string }) => {
    console.log('Fallback form submitted:', data);
    
    // Here you could send the data to your backend
    // For now, just show an alert
    Alert.alert(
      'Message Received',
      `Thank you ${data.name}! Your message has been received. We'll contact you at ${data.email} within 24 hours.`,
      [{ text: 'OK' }]
    );
  };

  const chatbotHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <meta http-equiv="Content-Security-Policy" content="default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f7fb;
          height: 100vh;
          overflow: hidden;
        }
        .chat-header {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          color: white;
          padding: 16px;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .chat-container {
          height: 100vh;
          width: 100vw;
          position: relative;
          padding-top: 60px;
          box-sizing: border-box;
        }
        .loading-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 60px);
          color: #64748b;
          font-size: 16px;
        }
        .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 60px);
          color: #dc2626;
          font-size: 16px;
          text-align: center;
          padding: 20px;
        }
        .fallback-form {
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #0f172a;
        }
        .form-input, .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e5eaf3;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }
        .form-button {
          background: #0f766e;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }
        .form-button:hover {
          background: #0d9488;
        }
      </style>
    </head>
    <body>
      <div class="chat-header">Pharmacy Support Chat</div>
      <div class="chat-container" id="jotform-agent-container">
        <div class="loading-message">Loading chat support...</div>
      </div>
      
      <script>
        // Function to initialize Jotform chatbot
        function initChatbot() {
          console.log('Initializing chatbot...');
          
          if (window.JotformAgent) {
            console.log('JotformAgent found, initializing...');
            try {
              window.JotformAgent.init({
                container: '#jotform-agent-container',
                agentID: '019dcf74f0a27e1091c9eff5da76c4466df8'
              });
              console.log('Chatbot initialized successfully');
            } catch (error) {
              console.error('Error initializing chatbot:', error);
              showFallbackForm();
            }
          } else {
            console.log('JotformAgent not found, retrying...');
            document.getElementById('jotform-agent-container').innerHTML = 
              '<div class="loading-message">Loading chat support...</div>';
            setTimeout(initChatbot, 1000);
          }
        }
        
        // Load Jotform script dynamically
        function loadJotformScript() {
          console.log('Loading Jotform script...');
          const script = document.createElement('script');
          script.src = 'https://cdn.jotfor.ms/agent/embedjs/019dcf74f0a27e1091c9eff5da76c4466df8/embed.js';
          script.onload = function() {
            console.log('Jotform script loaded successfully');
            setTimeout(initChatbot, 500);
          };
          script.onerror = function() {
            console.error('Failed to load Jotform script');
            showFallbackForm();
          };
          document.head.appendChild(script);
        }
        
        // Start loading
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', loadJotformScript);
        } else {
          loadJotformScript();
        }
        
        // Fallback form function
        function showFallbackForm() {
          console.log('Showing fallback form');
          document.getElementById('jotform-agent-container').innerHTML = \`
            <div class="fallback-form">
              <h3>Chat Support Unavailable</h3>
              <p>Please use this form to contact our support team directly.</p>
              <form onsubmit="submitForm(event)">
                <div class="form-group">
                  <label class="form-label">Name:</label>
                  <input type="text" class="form-input" id="contact-name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email:</label>
                  <input type="email" class="form-input" id="contact-email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Message:</label>
                  <textarea class="form-textarea" id="contact-message" required></textarea>
                </div>
                <button type="submit" class="form-button">Send Message</button>
              </form>
            </div>
          \`;
          
          // Add form submission handler
          window.submitForm = function(event) {
            event.preventDefault();
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;
            
            // Send message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'fallback_form_submit',
                data: { name, email, message }
              }));
            }
            
            // Show success message
            document.getElementById('jotform-agent-container').innerHTML = \`
              <div class="fallback-form">
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                <button class="form-button" onclick="showFallbackForm()">Send Another Message</button>
              </div>
            \`;
          };
        }
      </script>
    </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <View style={styles.placeholder} />
        </View>
        
        <WebView
          source={{ html: chatbotHTML }}
          style={styles.webview}
          onLoadStart={() => {
            console.log('WebView loading started');
            setIsLoading(true);
          }}
          onLoadEnd={() => {
            console.log('WebView loading ended');
            setIsLoading(false);
          }}
          onLoad={() => console.log('WebView loaded successfully')}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
            setIsLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error: ', nativeEvent);
            setIsLoading(false);
          }}
          onMessage={(event) => {
            console.log('WebView message: ', event.nativeEvent.data);
            try {
              const message = JSON.parse(event.nativeEvent.data);
              if (message.type === 'fallback_form_submit') {
                handleFallbackFormSubmit(message.data);
              }
            } catch (error) {
              console.log('Non-JSON message:', event.nativeEvent.data);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          mixedContentMode="compatibility"
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  placeholder: {
    width: 36
  },
  webview: {
    flex: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f7fb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16
  }
});
