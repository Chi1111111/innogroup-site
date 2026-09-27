export const inLastDay = (value: string | undefined, now = Date.now()) => {
  const timestamp = Date.parse(value ?? '');
  return Number.isFinite(timestamp) && timestamp <= now && timestamp > now - 86400000;
};
export function explainProblem(message = '') {
  if (/not a fast forward|git\/refs\/heads\/main.*422/i.test(message)) return '发布车源时，网站上同时有其他更新，这一批没有发布成功。请查看已保存的找车进度；如果一直没有继续，请让负责 Mac 的同事检查。';
  if (/429|rate.?limit|额度|限流/i.test(message)) return '来源网站暂时限制访问，请先等待，不要反复点击重试。';
  if (/403|401|access.?challenge|Authentication|拒绝访问/i.test(message)) return '暂时无法访问来源网站或连接服务，请让负责 Mac 的同事检查连接。';
  if (/CAPACITY|容量|storage.*limit/i.test(message)) return '图片存储空间不足，需要先检查可用空间。';
  if (/timeout|timed out|network|connection|SSL|DNS|超时|网络/i.test(message)) return '连接超时或网络不稳定，这次没有顺利完成。';
  if (/checksum|verification|verified|校验/i.test(message)) return '上传后的图片没有通过完整性检查，暂时不能使用。';
  return '这一步没有完成，需要负责 Mac 的同事检查；原因暂时无法确定。';
}
export const photoSteps: Record<string,string> = {
  download:'正在下载原始图片', decode:'正在打开图片', detect:'正在检查有没有水印', repair:'正在去除水印', encode:'正在压缩图片，方便网页加载', upload_original:'正在保存原图，方便之后对比', upload_verify:'正在上传并检查处理后的图片', cloud_claim:'正在领取下一张图片', cloud_complete:'正在保存处理结果', cloud_original:'正在保存原图', cloud_cleanup_approved:'正在清理不再需要的原图', cloud_pause_source:'正在暂停图片下载', cloud_fail:'正在记录本次失败',
};
