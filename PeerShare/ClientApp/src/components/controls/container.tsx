import * as React from "react";
import { classNames } from "../../utils/class-names.ts";

type Variant = "dark" | "light" | "alert";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
};

export const Container = ({
  className,
  variant,
  children,
  ...props
}: Props) => {
  return (
    <div
      data-variant={variant}
      className={classNames("container-root", className)}
      {...props}
    >
      {children}
    </div>
  );
};
