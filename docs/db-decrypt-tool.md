# 数据库快速加解密工具

## 功能说明

该工具通过自动化操作系统控制台（http://172.29.3.91:8080/epoint-common-web/webencrypt）来解密数据库配置信息。

## 使用方法

1. 在侧边栏菜单中选择"数据库快速加解密"
2. 在密文输入框中按照以下格式输入加密的数据库配置：

```
url={SM4_1::}密文
username={SM4_1::}密文
password={SM4_1::}密文
```

3. 点击"解密"按钮
4. 等待解密完成，结果将显示在下方的输出框中

## 示例

### 输入格式：
```
url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username={SM4_1::}F4735284672EFED7FF0389BAD2B93DAC
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9
```

### 输出格式：
```
url=jdbc:sqlserver://localhost;databaseName=epointbid_JAVAYEWU_test
username=sa
password=123456
```

## 技术实现

1. 工具会自动打开一个隐藏的浏览器窗口
2. 加载系统的加解密页面
3. 切换到"通用加解密"标签页
4. 设置解密参数：
   - 加密类型：SM4_1
   - 添加密文前缀：是
   - 算法模式：老模式
5. 依次解密 url、username、password
6. 返回解密结果并关闭浏览器窗口

## 注意事项

- 确保能够访问 http://172.29.3.91:8080/epoint-common-web/webencrypt
- 输入的密文格式必须正确，包含 `{SM4_1::}` 前缀
- 解密过程需要几秒钟时间，请耐心等待
- 如果解密失败，请检查网络连接和密文格式
