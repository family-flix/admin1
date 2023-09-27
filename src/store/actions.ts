/**
 * 在页面间切换时，希望上一个页面做的事情
 */
export const pendingActions: Partial<{
  deleteTV: {
    tv_id: string;
    id: string;
  };
  deleteMovie: {
    movie_id: string;
  };
}> = {};
export function appendAction<T extends keyof typeof pendingActions>(key: T, value: (typeof pendingActions)[T]) {
  pendingActions[key] = value;
}
export function consumeAction(key: keyof typeof pendingActions) {
  delete pendingActions[key];
}
