<template lang="pug">
.chat-modal-overlay(v-if="isVisible" @click="closeModal")
  .chat-modal(@click.stop)
    .chat-header
      button.close-btn(@click="closeModal")
        i.material-icons close
    
    .chat-content
      .avatar
        img.avatar-image(src="/src/assets/images/avatar.png" alt="Character Avatar")
      
      .messages-container
        .message(
          v-for="(message, index) in visibleMessages"
          :key="index"
          :class="{ 'typing': message.isTyping }"
        )
          .message-bubble
            span(v-if="message.isTyping") {{ message.text }}
            span(v-else) {{ message.text }}
        
        .typing-indicator(v-if="isTyping")
          .typing-dots
            span.dot
            span.dot
            span.dot
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { ArcRotateCamera, Scene } from "@babylonjs/core";

interface Message {
  text: string;
  isTyping: boolean;
}

interface Props {
  isVisible: boolean;
  camera?: ArcRotateCamera;
  scene?: Scene;
}

interface Emits {
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const messages = ref<string[]>([
  "Hello!",
  "Standing outside forever is fun…",
  "But you might want to click the house to actually get in",
]);
const visibleMessages = ref<Message[]>([]);
const isTyping = ref(false);
const currentMessageIndex = ref(0);

const closeModal = () => {
  emit("close");
  resetChat();
};

const resetChat = () => {
  visibleMessages.value = [];
  currentMessageIndex.value = 0;
  isTyping.value = false;
};

const typeMessage = async (text: string): Promise<void> => {
  return new Promise((resolve) => {
    const messageIndex = visibleMessages.value.length;
    visibleMessages.value.push({ text: "", isTyping: true });

    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        // Create new object to trigger reactivity
        visibleMessages.value[messageIndex] = {
          text: text.substring(0, currentIndex + 1),
          isTyping: true,
        };
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Final update with complete text
        visibleMessages.value[messageIndex] = {
          text: text,
          isTyping: false,
        };
        // Add small delay to ensure the final character is visible
        setTimeout(() => {
          resolve();
        }, 100);
      }
    }, 50); // 50ms per character
  });
};

const showTypingIndicator = (): Promise<void> => {
  return new Promise((resolve) => {
    isTyping.value = true;
    setTimeout(() => {
      isTyping.value = false;
      resolve();
    }, 1500);
  });
};

const startChatSequence = async () => {
  resetChat();

  for (let i = 0; i < messages.value.length; i++) {
    // Show typing indicator
    await showTypingIndicator();

    // Type the message
    await typeMessage(messages.value[i]);

    // Small pause between messages
    if (i < messages.value.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};

// Watch for modal visibility to start chat sequence
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        startChatSequence();
      });
    }
  },
);
</script>

<style scoped>
.chat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.chat-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chat-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.close-btn i {
  font-size: 24px;
  color: #6b7280;
}

.chat-content {
  padding: 16px;
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.avatar {
  display: flex;
  justify-content: flex-start;
}

.avatar-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #3c82f6;
  background: #f3f4f6;
  object-fit: cover;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message {
  display: flex;
  justify-content: flex-start;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-bubble {
  background: #3b82f6;
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.4;
  position: relative;
}
.message:last-child {
  .message-bubble {
    border-bottom-left-radius: 4px;
  }
}

.message.typing .message-bubble {
  background: #60a5fa;
}

.message.typing .message-bubble::after {
  content: "|";
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.typing-dots {
  background: #3c82f6;
  border: 1px solid #3c82f6;
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #fff;
  animation: typingAnimation 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingAnimation {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .chat-modal {
    width: 95%;
    margin: 16px;
  }

  .chat-content {
    padding: 16px;
  }

  .message-bubble {
    font-size: 14px;
    padding: 10px 14px;
  }
}
</style>
