import classNames from 'classnames';
import kebabCase from 'lodash/kebabCase';
import { useMosaicContext } from '../contextTypes';

export namespace OptionalBlueprint {
  export const Icon = (props: {
    icon: string;
    className?: string;
    size?: 'standard' | 'large';
  }) => {
    const ctx = useMosaicContext();
    const size = () => props.size ?? 'standard';
    return (
      <span
        class={classNames(
          props.className,
          getIconClass(ctx.blueprintNamespace, props.icon),
          `${ctx.blueprintNamespace}-icon-${size()}`,
        )}
      />
    );
  };

  export function getClasses(blueprintNamespace: string, ...names: string[]): string {
    return names.map((name) => `${blueprintNamespace}-${kebabCase(name)}`).join(' ');
  }

  export function getIconClass(blueprintNamespace: string, iconName: string): string {
    return `${blueprintNamespace}-icon-${kebabCase(iconName)}`;
  }
}
