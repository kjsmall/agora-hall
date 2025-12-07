import { render, screen } from '@testing-library/react';
import App from './App';
import { createDebateTurn, DEBATE_STATUS } from './utils/domainModels';

test('renders login screen by default', () => {
  render(<App />);
  expect(screen.getByText(/Agora Hall Login/i)).toBeInTheDocument();
});

test('createDebateTurn enforces linear turn shape', () => {
  const turn = createDebateTurn({
    debateId: 'debate-1',
    turnNumber: 1,
    authorId: 'alex',
    content: 'Test turn',
  });
  expect(turn.turnNumber).toBe(1);
  expect(turn.debateId).toBe('debate-1');
  expect(turn.authorId).toBe('alex');
  expect(turn.content).toBe('Test turn');
});

test('debate status includes active/resolved/scheduled', () => {
  expect(DEBATE_STATUS.ACTIVE).toBe('active');
  expect(DEBATE_STATUS.RESOLVED).toBe('resolved');
  expect(DEBATE_STATUS.SCHEDULED).toBe('scheduled');
});
