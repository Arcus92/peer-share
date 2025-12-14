import * as React from "react";
import { classNames } from "../../utils/class-names.ts";

type Props = React.ProgressHTMLAttributes<HTMLProgressElement>;

export function Progress({ className, ...props }: Props) {
  return (
    <progress className={classNames("progress-root", className)} {...props} />
  );
}
