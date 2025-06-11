!macro customHeader
    !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
    # 设置默认安装路径为 C:\Program Files\HUHAToolBox
    StrCpy $INSTDIR "$PROGRAMFILES64\${APP_FILENAME}"
    
    # 如果已经安装过，使用之前的安装路径
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" "InstallLocation"
    ${If} $R0 != ""
        StrCpy $INSTDIR $R0
    ${EndIf}
!macroend

!macro customInstall
    # 创建开始菜单快捷方式
    CreateShortCut "$SMPROGRAMS\${APP_FILENAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    
    # 写入卸载信息到注册表
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" "InstallLocation" "$INSTDIR"
!macroend

!macro customUnInstall
    # 删除开始菜单快捷方式
    Delete "$SMPROGRAMS\${APP_FILENAME}.lnk"
    
    # 删除注册表信息
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}"
!macroend 