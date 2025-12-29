# 数据库快速加解密工具

## 功能说明

该工具通过自动化操作系统控制台（http://172.29.3.91:8080/epoint-common-web/webencrypt）来加密或解密数据库配置信息。

## 功能特性

- **双向操作**：支持加密和解密两种模式
- **一键切换**：通过滑块快速切换加密/解密模式
- **自动化处理**：自动打开浏览器窗口，设置参数，执行操作
- **示例填充**：提供示例数据快速测试功能

## 使用方法

### 解密模式

1. 在侧边栏菜单中选择"数据库快速加解密"
2. 确保滑块处于"解密模式"（左侧）
3. 在输入框中按照以下格式输入加密的数据库配置：

```
url={SM4_1::}密文
username={SM4_1::}密文
password={SM4_1::}密文
```

4. 点击"解密"按钮
5. 等待解密完成，结果将显示在下方的输出框中

#### 解密示例

**输入格式：**
```
url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username={SM4_1::}F4735284672EFED7FF0389BAD2B93DAC
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9
```

**输出格式：**
```
url=jdbc:sqlserver://localhost;databaseName=epointbid_JAVAYEWU_test
username=sa
password=123456
```

### 加密模式

1. 在侧边栏菜单中选择"数据库快速加解密"
2. 将滑块切换到"加密模式"（右侧）
3. 在输入框中按照以下格式输入明文的数据库配置：

```
url=jdbc:sqlserver://localhost;databaseName=xxx
username=用户名
password=密码
```

4. 点击"加密"按钮
5. 等待加密完成，结果将显示在下方的输出框中

#### 加密示例

**输入格式：**
```
url=jdbc:sqlserver://localhost;databaseName=epointbid_JAVAYEWU_test
username=sa
password=123456
```

**输出格式：**
```
url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username={SM4_1::}F4735284672EFED7FF0389BAD2B93DAC
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9
```

## 技术实现

### 解密流程

1. 工具会自动打开一个隐藏的浏览器窗口
2. 加载系统的加解密页面
3. 切换到"通用加解密"标签页
4. 设置解密参数：
   - 加密类型：SM4_1
   - 添加密文前缀：是
   - 算法模式：老模式
5. 依次解密 url、username、password
6. 返回解密结果并关闭浏览器窗口

### 加密流程

1. 工具会自动打开一个隐藏的浏览器窗口
2. 加载系统的加解密页面
3. 切换到"通用加解密"标签页
4. 设置加密参数：
   - 加密类型：SM4_1
   - 添加密文前缀：是
   - 算法模式：老模式
5. 依次加密 url、username、password
6. 返回加密结果（自动添加 {SM4_1::} 前缀）并关闭浏览器窗口

## 注意事项

- 确保能够访问 http://172.29.3.91:8080/epoint-common-web/webencrypt
- 输入的格式必须正确
  - 解密模式：必须包含 `{SM4_1::}` 前缀
  - 加密模式：按照 `key=value` 格式，每行一个配置项
- 加解密过程需要几秒钟时间，请耐心等待
- 如果操作失败，请检查网络连接和输入格式
- 切换模式时会自动清空输入和输出内容
