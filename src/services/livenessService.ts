type LivenessChallenge = 'blink' | 'smile' | 'turn_left';

export function getRandomChallenge(): LivenessChallenge {
  const challenges: LivenessChallenge[] = ['blink', 'smile', 'turn_left'];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

export function getChallengeInstruction(challenge: LivenessChallenge, t: any): string {
  switch (challenge) {
    case 'blink': return t.blink;
    case 'smile': return t.smile;
    case 'turn_left': return t.turnLeft;
  }
}
