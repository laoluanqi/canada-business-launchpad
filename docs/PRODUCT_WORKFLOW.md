# Canada Business Launchpad | 产品闭环说明

## 产品定位

面向安省小企业的创业规划与进度工作台。不是政府办理平台，也不只是网站目录。
核心价值：根据企业情况组织行动，连接办理前准备、办理后结果和持续事项。

**企业情况 → 行动计划 → 材料准备 → 外部办理 → 结果记录 → 下一任务／持续跟进。**

主入口：`/zh/launch`；英文：`/en/launch`。`/present` 是辅助介绍入口。

## 使用路径

1. **建立工作台**：填写项目昵称，核对经营阶段、结构、地区、收入区间、招聘等情况，确认服务端保存说明后创建。无需法定名称或身份资料。
2. **查看行动计划**：先看下一步，再看全部阶段。必需、条件适用、可选及专业审核分别标记。处理进度不是合规评分，可选事项不计入百分比。
3. **准备材料**：进入任务核对前置事项、材料及官方来源。仅保存就绪标记，不上传文件。
4. **前往办理**：官方入口在新标签页打开。访问记录不等于已提交申请。
5. **回填结果**：返回任务，选择仍在准备、外部已提交待处理、遇到问题或已完成。等待与问题必须填写跟进日期。
6. **继续下一步**：核对材料、前置任务和完成日期，自主确认后保存。随后继续下一任务，也可以重新打开已完成任务。
7. **持续事项**：选择关联任务，填写具体周期或用途及已确认日期。每期独立完成，录错的日期或周期可以更正。
8. **更新经营情况**：修改招聘等情况时企业ID不变，原记录保留；新增事项加入计划，原完成事项提示重新核对。
9. **日后继续**：在同一浏览器重新打开，恢复服务端记录。中英文切换不改变企业或进度。

## 一条完整体验

创建“我的安省工作室” → 核对企业情况 → 处理“选择企业结构” → 勾选材料 →
访问官方来源 → 返回记录等待和日期 → 记录补充材料问题 → 完成并进入下一任务 →
添加本期与下期事项 → 仅完成本期 → 修改为准备招聘，查看新增任务及保留的历史。

对外介绍重点：**平台连接真实的规划与进度管理，政府审批和专业判断仍由对应机构负责。**

## 当前边界

| 已实现 | 未实现 |
|---|---|
| 独立企业ID、服务端持续保存 | 账户注册、恢复、跨设备登录、多企业管理 |
| 个性化计划、材料准备、状态和下一步 | 政府提交、实时政府状态同步 |
| 外部等待、问题类型及跟进日期 | 代替服务商回复、保证受理或批准 |
| 独立周期、日期更正、历史、JSON导出 | 自动计算所有法定期限、邮件推送 |
| 专业沟通清单及联系进度记录 | 最终法律、税务、保险、移民意见 |
| 保存失败反馈及版本冲突保护 | 生产级身份体系、安全审计及专业签审 |

## 保存与隐私

- 昵称、问诊、任务记录、准备标记、问题类型和日期保存在本服务端数据库。
- 当前本地版本使用本机服务和数据库；发布后才使用相应托管服务。
- 浏览器专用Cookie是访问凭据，不是经核验身份；同浏览器不同标签页共享工作台。
- 清除Cookie后无法找回。JSON导出用于保留记录，暂不提供导入恢复。
- 最多100条日期事项和最近200次操作；任务记录不会因修改企业情况或查看样例而删除。
- 保存失败必须明确显示，不能把界面暂时状态当成已保存记录。
- 不填写政府凭据、银行资料、证件、税表或真实回执。不向政府或伙伴发送数据。

## 下一阶段

先验证创业者是否能独立跑通流程并持续回来更新，再补账户恢复、多设备同步、隐私与安全审查、专业内容复核，最后才对接经授权服务商和通知渠道。

---

# English | Working product loop

Start at `/en/launch`. Create a private workspace with a nickname and reviewed
business facts. Follow the next task, prepare materials, and visit the official
source. Return to record preparation, waiting, an issue or completion. Waiting
and problems require a follow-up date; completion is explicitly user-reported.

Manage each period separately. Correct dates when needed; finishing the current
period does not close a future one. Business changes preserve the ID and prior
records, add applicable tasks and flag earlier completions for a fresh check.
Language switches and reloads retain saved progress.

The service saves data in a database. A private browser cookie grants access;
losing it loses access. Account recovery, cross-device sign-in, multiple businesses
and import/restore are not yet available. Export provides a record copy only.

No government submissions, live government status, payments, uploads, emails or
partner transfers occur. Dates are user-confirmed planning records, not calculated
statutory deadlines. Expert-review tasks track preparation and contact, not final
professional conclusions. Samples and presentation cannot overwrite the personal
workspace. Broader launch requires identity/recovery, privacy, security and
professional content review.
