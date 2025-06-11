import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ThemeColor } from "./store/settings"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 固定的背景色变量
const fixedBackground = {
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 3.9%",
    card: "0 0% 100%",
    "card-foreground": "0 0% 3.9%",
    border: "0 0% 89.8%",
  },
  dark: {
    background: "0 0% 3.9%",
    foreground: "0 0% 98%",
    card: "0 0% 3.9%",
    "card-foreground": "0 0% 98%",
    border: "0 0% 14.9%",
  }
}

const themeColorMap = {
  blue: {
    light: {
      primary: "221.2 50% 53.3%",
    },
    dark: {
      primary: "221.2 50% 53.3%",
    }
  },
  green: {
    light: {
      primary: "150 40% 40%",
    },
    dark: {
      primary: "150 40% 45%",
    }
  },
  purple: {
    light: {
      primary: "262 45% 55%",
    },
    dark: {
      primary: "262 45% 60%",
    }
  },
  rose: {
    light: {
      primary: "346 40% 45%",
    },
    dark: {
      primary: "346 40% 50%",
    }
  },
  orange: {
    light: {
      primary: "30 40% 45%",
    },
    dark: {
      primary: "30 40% 50%",
    }
  },
  "blue-vibrant": {
    light: {
      primary: "221.2 83.2% 53.3%",
    },
    dark: {
      primary: "221.2 83.2% 53.3%",
    }
  },
  "green-vibrant": {
    light: {
      primary: "150 76.2% 36.3%",
    },
    dark: {
      primary: "150 76.2% 41.3%",
    }
  },
  "purple-vibrant": {
    light: {
      primary: "262 83.3% 57.8%",
    },
    dark: {
      primary: "262 83.3% 62.8%",
    }
  },
  "rose-vibrant": {
    light: {
      primary: "346 77.2% 49.8%",
    },
    dark: {
      primary: "346 77.2% 54.8%",
    }
  },
  "orange-vibrant": {
    light: {
      primary: "30 95% 53.1%",
    },
    dark: {
      primary: "30 95% 58.1%",
    }
  }
} as const

export function getThemeColorVariables(color: ThemeColor, isDark: boolean = false) {
  const theme = themeColorMap[color][isDark ? 'dark' : 'light']
  const background = fixedBackground[isDark ? 'dark' : 'light']
  const variables: Record<string, string> = {}

  // 设置基础变量
  Object.entries(theme).forEach(([key, value]) => {
    variables[`--${key}`] = value
  })

  // 设置背景相关变量
  Object.entries(background).forEach(([key, value]) => {
    variables[`--${key}`] = value
  })

  // 设置衍生变量
  variables['--muted'] = isDark ? background.card : '0 0% 96.1%'
  variables['--muted-foreground'] = isDark ? '215 20.2% 65.1%' : '220 8.9% 46.1%'
  variables['--accent'] = isDark ? background.card : '0 0% 96.1%'
  variables['--accent-foreground'] = isDark ? background.foreground : '220 13% 91%'
  variables['--destructive'] = '0 84.2% 60.2%'
  variables['--destructive-foreground'] = background.foreground
  variables['--ring'] = theme.primary
  variables['--radius'] = '0.75rem'

  return variables
}
