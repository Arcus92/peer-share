import * as React from "react";
import { classNames } from "../../utils/class-names.ts";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ className, children, ...props }: Props) => {
  return (
    <button className={classNames("btn-root", className)} {...props}>
      {children}
    </button>
  );
};
