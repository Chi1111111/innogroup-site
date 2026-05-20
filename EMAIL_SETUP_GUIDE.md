# EmailJS 设置说明

网站表单目前使用 `EmailJS + Cloudinary`：

- `EmailJS`：发送询盘邮件
- `Cloudinary`：上传客户图片并把图片链接写入邮件内容

## 需要配置的文件

- `src/config/emailConfig.ts`
- `src/config/cloudinaryConfig.ts`

## EmailJS 配置步骤

1. 注册并登录 [EmailJS](https://www.emailjs.com/)
2. 在 `Email Services` 中添加邮箱服务
3. 在 `Email Templates` 中创建模板
4. 记录以下信息：
   - `Service ID`
   - `Template ID`
   - `Public Key`

## 表单模板建议字段

模板里建议包含这些变量：

```text
{{inquiryType}}
{{sourceType}}
{{brand}}
{{model}}
{{year}}
{{budget}}
{{name}}
{{phone}}
{{email}}
{{message}}
{{photoInfo}}
{{photoHtml}}
```

## emailConfig.ts 示例

```ts
export const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
  publicKey: 'YOUR_PUBLIC_KEY',
};
```

## Cloudinary 配置说明

1. 登录 Cloudinary
2. 创建一个 `unsigned upload preset`
3. 更新 `src/config/cloudinaryConfig.ts` 中的：
   - `cloudName`
   - `uploadPreset`
   - `uploadUrl`

## 测试流程

1. 启动项目
2. 打开报价表单
3. 提交一条测试询盘
4. 检查邮件是否收到
5. 如果上传了图片，确认邮件中的图片链接可访问

## 常见问题

- 邮件发不出去：先检查 `Service ID / Template ID / Public Key`
- 图片上传失败：检查 Cloudinary 的 `upload preset` 是否允许 unsigned 上传
- 邮件模板缺字段：确认 EmailJS 模板变量名称和代码中的参数一致
