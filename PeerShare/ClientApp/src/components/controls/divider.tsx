import { classNames } from "../../utils/class-names.ts";
import * as React from "react";

type Variant = "horizontal" | "vertical";

type Props = React.HTMLAttributes<HTMLHRElement> & {
  variant?: Variant;
};

export function Divider({ variant, className, ...props }: Props) {
  return (
    <hr
      data-variant={variant}
      className={classNames("divider-root", className)}
      {...props}
    />
  );
}
