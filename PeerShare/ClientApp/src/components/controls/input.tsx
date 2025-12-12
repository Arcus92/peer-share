import * as React from "react";
import { classNames } from "../../utils/class-names.ts";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: Props) => {
  return <input className={classNames("input-root", className)} {...props} />;
};
