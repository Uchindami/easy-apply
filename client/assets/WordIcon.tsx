import * as React from "react";
import { type SVGProps } from "react";
const WordIcon = ({
  className,
  ...props
}: SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 0 48 48"
    {...props}
  >
    <linearGradient
      id="a"
      x1={28}
      x2={28}
      y1={14.966}
      y2={6.45}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#42a3f2" />
      <stop offset={1} stopColor="#42a4eb" />
    </linearGradient>
    <path fill="url(#a)" d="M42 6H14a2 2 0 0 0-2 2v7.003h32V8a2 2 0 0 0-2-2z" />
    <linearGradient
      id="b"
      x1={28}
      x2={28}
      y1={42}
      y2={33.054}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#11408a" />
      <stop offset={1} stopColor="#103f8f" />
    </linearGradient>
    <path
      fill="url(#b)"
      d="M12 33.054V40a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-6.946H12z"
    />
    <linearGradient
      id="c"
      x1={28}
      x2={28}
      y1={-15.46}
      y2={-15.521}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#3079d6" />
      <stop offset={1} stopColor="#297cd2" />
    </linearGradient>
    <path fill="url(#c)" d="M12 15.003h32v9.002H12v-9.002z" />
    <linearGradient
      id="d"
      x1={12}
      x2={44}
      y1={28.53}
      y2={28.53}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#1d59b3" />
      <stop offset={1} stopColor="#195bbc" />
    </linearGradient>
    <path fill="url(#d)" d="M12 24.005h32v9.05H12v-9.05z" />
    <path
      d="M22.319 13H12v24h10.319A3.68 3.68 0 0 0 26 33.319V16.681A3.68 3.68 0 0 0 22.319 13z"
      opacity={0.05}
    />
    <path
      d="M22.213 36H12V13.333h10.213a3.12 3.12 0 0 1 3.121 3.121v16.425A3.122 3.122 0 0 1 22.213 36z"
      opacity={0.07}
    />
    <path
      d="M22.106 35H12V13.667h10.106a2.56 2.56 0 0 1 2.56 2.56V32.44a2.56 2.56 0 0 1-2.56 2.56z"
      opacity={0.09}
    />
    <linearGradient
      id="e"
      x1={4.744}
      x2={23.494}
      y1={14.744}
      y2={33.493}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#256ac2" />
      <stop offset={1} stopColor="#1247ad" />
    </linearGradient>
    <path
      fill="url(#e)"
      d="M22 34H6a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2z"
    />
    <path
      fill="#fff"
      d="m18.403 19-1.546 7.264L15.144 19h-2.187l-1.767 7.489L9.597 19H7.641l2.344 10h2.352l1.713-7.689L15.764 29h2.251l2.344-10h-1.956z"
    />
  </svg>
);
export default WordIcon;
