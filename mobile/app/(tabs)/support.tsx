import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import Chatbot from '@/components/Chatbot';
import { useAuth } from '@/src/context/AuthContext';
import { request } from '@/src/lib/api';

export default function SupportScreen() {
  const { user, token } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  const categories = ['Order Issue', 'Payment Issue', 'Account Issue', 'Product Issue', 'Supplier Issue', 'Other'];

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await request<{ success: boolean; data?: any; message?: string }>('/tickets', {
        method: 'POST',
        token,
        body: {
          subject,
          category,
          description
        }
      });

      if (response.success) {
        Alert.alert(
          'Ticket Submitted',
          `Your support ticket has been submitted successfully. We'll respond within 24 hours.`,
          [{ text: 'OK', onPress: () => {
            setSubject('');
            setDescription('');
            setCategory('Other');
          }}]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit ticket');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} backgroundColor="#f5f7fb">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Support" subtitle="Create a support ticket and our team will help you resolve any issues." />

        <View style={styles.supportCard}>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color="#0f766e" />
              <Text style={styles.contactText}>support@pharmacy.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color="#0f766e" />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="time" size={20} color="#0f766e" />
              <Text style={styles.contactText}>Mon-Fri, 9AM-6PM EST</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Create Support Ticket</Text>
          
          <TextInput
            placeholder="Subject"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat: string) => (
              <View key={cat} style={styles.categoryOption}>
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  {cat}
                </Text>
              </View>
            ))}
          </View>

          <TextInput
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#94a3b8"
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <View style={styles.buttonContainer}>
            <Text style={styles.submitButton} onPress={submitTicket} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </Text>
          </View>
        </View>

        <View style={styles.chatbotContainer}>
          <Text style={styles.chatbotTitle}>Need instant help?</Text>
          <Text style={styles.chatbotText}>Try our AI chatbot for quick answers to common questions.</Text>
          <Text style={styles.chatbotButton} onPress={() => setShowChatbot(true)}>
            <Ionicons name="chatbubble" size={16} color="#0f766e" />
            {' '}Open Chatbot
          </Text>
        </View>
      </ScrollView>
      
      <Chatbot visible={showChatbot} onClose={() => setShowChatbot(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16
  },
  supportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 16
  },
  contactInfo: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5eaf3'
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  contactText: {
    color: '#64748b',
    fontSize: 16
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 18
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a'
  },
  textArea: {
    height: 120,
    paddingTop: 16
  },
  label: {
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 8
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center'
  },
  categoryText: {
    color: '#64748b',
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5eaf3',
    textAlign: 'center',
    fontSize: 12
  },
  categoryTextActive: {
    color: '#0f766e',
    backgroundColor: '#ecfdf5',
    borderColor: '#0f766e'
  },
  buttonContainer: {
    marginTop: 8
  },
  submitButton: {
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: '800',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 16
  },
  chatbotContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
  },
  chatbotTitle: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16
  },
  chatbotText: {
    color: '#64748b',
    lineHeight: 20
  },
  chatbotButton: {
    color: '#0f766e',
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 12,
    marginTop: 8
  }
});
