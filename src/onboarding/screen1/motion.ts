/** Reanimated configs built from the motion tokens. */
import { Easing } from 'react-native-reanimated';
import { ease, spring } from './tokens';

type SpringToken = (typeof spring)[keyof typeof spring];

/** A spring token (stiffness + damping ratio) as a Reanimated spring config. */
export function springConfig(token: SpringToken) {
  const mass = 1;
  return {
    mass,
    stiffness: token.stiffness,
    damping: 2 * token.dampingRatio * Math.sqrt(token.stiffness * mass),
  };
}

/** A cubic-bezier easing token as a Reanimated easing function. */
export function easing(token: (typeof ease)[keyof typeof ease]) {
  return Easing.bezier(token[0], token[1], token[2], token[3]);
}
