// route.ts - 添加客户信息工具
import { deepseek, createDeepSeek } from "@ai-sdk/deepseek";
import { convertToModelMessages, streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

// 天气查询工具定义
const weatherTool = tool({
  description: "查询指定城市的实时天气信息",
  inputSchema: z.object({
    location: z.string().describe('城市名称，如"北京"或"Shanghai"'),
    unit: z
      .enum(["C", "F"])
      .optional()
      .describe("温度单位，C为摄氏度，F为华氏度"),
  }),
  execute: async ({ location, unit = "C" }) => {
    console.log(`查询天气: 城市=${location}, 单位=${unit}`);
    return {
      location,
      temperature: unit === "C" ? 25 : 77,
      condition: "晴天",
      humidity: 45,
      unit,
    };
  },
});

// 二维码工具定义
const qrcodeTool = tool({
  description: "实时生成指定文本的二维码图片",
  inputSchema: z.object({
    text: z.string().describe("要生成二维码的文本内容"),
  }),
  execute: async ({ text }) => {
    console.log(`生成二维码: 文本=${text}`);
    return {
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        text
      )}&size=200x200`,
    };
  },
});

// // 客户信息查询工具定义
// const customerTool = tool({
//   description: "查询指定客户ID的详细信息，包括状态、查询时间等",
//   inputSchema: z.object({
//     customerId: z.string().describe('客户ID，如"C001"、"10001"或"VIP-2024-001"'),
//   }),
//   execute: async ({ customerId }) => {
//     console.log(`查询客户信息: 客户ID=${customerId}`);

//     // 模拟不同客户ID返回不同状态和数据
//     const statuses = ["活跃", "非活跃", "VIP", "待审核", "已冻结", "新客户"];
//     const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
//     // 模拟真实查询延迟
//     await new Promise(resolve => setTimeout(resolve, 300));

//     return {
//       customerId,
//       queryTime: new Date().toISOString(),
//       status: randomStatus,
//       // 可以扩展更多字段
//       customerName: `用户_${customerId}`,
//       registrationDate: "2024-01-15",
//     };
//   },
// });
// 客户信息查询工具定义（含字段校验逻辑）
const customerTool = tool({
  description: `查询指定客户ID的详细信息。如果查询授信相关客户(ID含CREDIT)但未提供授信状态，
  工具将返回不完整标记，需用户补充信息后重新查询。`,
  
  inputSchema: z.object({
    customerId: z.string().describe('客户ID，如"C001"或"CREDIT-001"'),
    // 通过自然语言解析授信状态
    creditStatus: z.enum(["已授信", "未授信", "授信未提现", "已提现"]).optional()
      .describe('从用户查询提取的授信状态，如"授信未提现"'),
  }),
  
  execute: async ({ customerId, creditStatus }) => {
    console.log(`查询客户信息: 客户ID=${customerId}, 授信状态=${creditStatus}`);

    // 模拟基础数据（故意不包含creditStatus）
    const baseData = {
      customerId,
      queryTime: new Date().toISOString(),
      status: "活跃",
      customerName: `用户_${customerId}`,
      registrationDate: "2024-01-15",
    };

    // 字段缺失校验：授信客户必须提供creditStatus
    if (customerId.includes("CREDIT") && !creditStatus) {
      return {
        ...baseData,
        __incomplete__: true,          // 标记数据不完整
        missingFields: ["creditStatus"], // 缺失字段列表
        requiredComponent: "credit-status-form", // 需渲染的组件类型
        message: "查询授信客户信息需补充授信状态",
      };
    }

    // 提供完整数据（包含授信信息）
    if (creditStatus) {
      return {
        ...baseData,
        creditStatus,
        creditAmount: creditStatus === "授信未提现" ? 50000 : 0,
        lastCreditDate: creditStatus === "授信未提现" ? "2024-11-01" : null,
      };
    }

    // 普通客户查询返回基础数据
    return baseData;
  },
});

const ds = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com/v1",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: ds("deepseek-chat"),
    messages: convertToModelMessages(messages),
    tools: {
      weather: weatherTool,
      qrcode: qrcodeTool,
      customer: customerTool, // 添加客户信息工具
    },
    experimental_activeTools: ["weather", "qrcode", "customer"],
  });

  return result.toUIMessageStreamResponse();
}