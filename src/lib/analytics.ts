// Umami 分析工具函数

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

/**
 * 跟踪事件到 Umami
 * @param eventName 事件名称
 * @param eventData 事件数据（可选）
 */
export const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
  try {
    if (window.umami) {
      window.umami.track(eventName, eventData);
    }
  } catch (error) {
    console.error('Umami tracking error:', error);
  }
};

// 工具使用事件
export const trackToolUsage = (toolName: string, action: string, extra?: Record<string, any>) => {
  trackEvent(`tool_${toolName}_${action}`, {
    tool: toolName,
    action,
    ...extra,
  });
};

// 菜单切换事件
export const trackMenuSwitch = (menuName: string) => {
  trackEvent('menu_switch', {
    menu: menuName,
  });
};

// 功能按钮点击事件
export const trackButtonClick = (toolName: string, buttonName: string) => {
  trackEvent('button_click', {
    tool: toolName,
    button: buttonName,
  });
};
