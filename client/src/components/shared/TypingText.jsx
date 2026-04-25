import { useState, useEffect, useCallback } from 'react';

const WORDS = ['Artwork', 'Design', 'Vector', 'Embroidery'];
const TYPING_SPEED = 100;
const DELETING_SPEED = 60;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_DELETING = 400;

export default function TypingText() {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = WORDS[wordIdx];
    if (!isDeleting) {
      setText(currentWord.slice(0, text.length + 1));
      if (text.length + 1 === currentWord.length) {
        setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPING);
        return;
      }
    } else {
      setText(currentWord.slice(0, text.length - 1));
      if (text.length - 1 === 0) {
        setIsDeleting(false);
        setWordIdx((prev) => (prev + 1) % WORDS.length);
        return;
      }
    }
  }, [text, wordIdx, isDeleting]);

  useEffect(() => {
    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting]);

  return (
    <span className="text-[#ff7a18]">
      {text}
      <span className="typing-cursor" />
    </span>
  );
}
