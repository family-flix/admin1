// const handleKeyDown = () => {
//   isUsingKeyboardRef.current = true;
//   document.addEventListener("pointerdown", handlePointer, {
//     capture: true,
//     once: true,
//   });
//   document.addEventListener("pointermove", handlePointer, {
//     capture: true,
//     once: true,
//   });
// };
// const handlePointer = () => (isUsingKeyboardRef.current = false);
// document.addEventListener("keydown", handleKeyDown, { capture: true });
// return () => {
//   document.removeEventListener("keydown", handleKeyDown, { capture: true });
//   document.removeEventListener("pointerdown", handlePointer, { capture: true });
//   document.removeEventListener("pointermove", handlePointer, { capture: true });
// };
