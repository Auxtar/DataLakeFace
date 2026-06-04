type LivenessChallenge = 'turn_left' | 'turn_right';

export function getRandomChallenge(): LivenessChallenge {
  const challenges: LivenessChallenge[] = ['turn_left', 'turn_right'];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

export function getChallengeInstruction(challenge: LivenessChallenge, t: any): string {
  switch (challenge) {
    case 'turn_left': return t.turnLeft;
    case 'turn_right': return t.turnRight;
  }
}
