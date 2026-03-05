import { ExpandButton } from './ExpandButton';
import { RemoveButton } from './RemoveButton';
import { ReplaceButton } from './ReplaceButton';
import { SplitButton } from './SplitButton';

export function DEFAULT_CONTROLS_WITH_CREATION() {
  return (
    <>
      <ReplaceButton />
      <SplitButton />
      <ExpandButton />
      <RemoveButton />
    </>
  );
}

export function DEFAULT_CONTROLS_WITHOUT_CREATION() {
  return (
    <>
      <ExpandButton />
      <RemoveButton />
    </>
  );
}
