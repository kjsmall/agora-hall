import { render, screen } from '@testing-library/react';
import App from './App';
import { createRoom, ROOM_PHASES } from './utils/RoomClass';

test('renders login form by default', () => {
  render(<App />);
  expect(screen.getByText(/Log In to Agora/i)).toBeInTheDocument();
});

test('createRoom supplies defaults and phases', () => {
  const room = createRoom({ id: 123, topic: 'Test' });
  expect(room.id).toBe(123);
  expect(room.topic).toBe('Test');
  expect(room.phase).toBe(ROOM_PHASES.SETUP);
  expect(Array.isArray(room.definitions)).toBe(true);
  expect(room.rebuttalSubmitted).toBe(false);
});
