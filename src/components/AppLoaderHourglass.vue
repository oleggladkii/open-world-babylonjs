<template lang="pug">
svg(
  width="73px",
  height="88px",
  viewBox="0 0 73 88",
  version="1.1",
  xmlns="http://www.w3.org/2000/svg",
  xmlns:xlink="http://www.w3.org/1999/xlink"
)
  g#hourglass
    path#glass(
      d="M63.8761664,86 C63.9491436,84.74063 64,83.4707791 64,82.1818182 C64,65.2090455 57.5148507,50.6237818 48.20041,44 C57.5148507,37.3762182 64,22.7909545 64,5.81818182 C64,4.52922091 63.9491436,3.25937 63.8761664,2 L10.1238336,2 C10.0508564,3.25937 10,4.52922091 10,5.81818182 C10,22.7909545 16.4851493,37.3762182 25.79959,44 C16.4851493,50.6237818 10,65.2090455 10,82.1818182 C10,83.4707791 10.0508564,84.74063 10.1238336,86 L63.8761664,86 Z",
      fill="#ecf1f6"
    )
    rect#top-plate(
      fill="#4D4544",
      x="0",
      y="0",
      width="74",
      height="8",
      rx="2"
    )
    rect#bottom-plate(
      fill="#4D4544",
      x="0",
      y="80",
      width="74",
      height="8",
      rx="2"
    )
    g#top-sand(transform="translate(18, 21)")
      clipPath#top-clip-path(fill="white")
        rect(x="0", y="0", width="38", height="21")
      path(
        fill="#f5a623",
        clip-path="url(#top-clip-path)",
        d="M38,0 C36.218769,7.51704545 24.818769,21 19,21 C13.418769,21 1.9,7.63636364 0,0 L38,0 Z"
      )
    g#bottom-sand(transform="translate(18, 55)")
      clipPath#bottom-clip-path(fill="white")
        rect(x="0", y="0", width="38", height="21")
      g(clip-path="url(#bottom-clip-path)")
        path(
          fill="#f5a623",
          d="M0,21 L38,21 C36.1,13.3636364 24.581231,0 19,0 C13.181231,0 1.781231,13.4829545 0,21 Z"
        )
</template>

<style scoped lang="scss">
$animation-duration: 5s;
$animation-delay: 1s;
$sand-color: #f5a623;
$glass-color: #ecf1f6;
$plate-color: #4d4544;

@keyframes top-clip {
  0% {
    transform: translateY(0);
  }
  50%,
  100% {
    transform: translateY(21px);
  }
}

@keyframes bottom-sand-path {
  0% {
    transform: translateY(21px);
  }
  50%,
  100% {
    transform: translateY(0);
  }
}

@keyframes bottom-sand-g {
  0%,
  85% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-9px);
  }
}

@keyframes hourglass-rotation {
  50% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(180deg);
  }
}

#top-sand {
  #top-clip-path rect {
    animation: top-clip $animation-duration $animation-delay infinite;
  }
}

#bottom-sand {
  path {
    transform: translateY(21px);
    animation: bottom-sand-path $animation-duration $animation-delay infinite;
  }

  g {
    animation: bottom-sand-g $animation-duration $animation-delay infinite;
  }
}

svg {
  animation: hourglass-rotation $animation-duration $animation-delay infinite;
}
</style>
