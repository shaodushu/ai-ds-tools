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
    // 实际项目中调用真实天气API（如OpenWeatherMap）
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.WEATHER_API_KEY}&units=${unit === 'C' ? 'metric' : 'imperial'}`)
    // return response.json();

    console.log(`查询天气: 城市=${location}, 单位=${unit}`);

    // 模拟API响应
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

    // 模拟API响应
    return {
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        text
      )}&size=200x200`,
    };
  },
});

const ds = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com/v1",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: ds("deepseek-chat"), // 使用DeepSeek模型
    messages: convertToModelMessages(messages),
    tools: {
      weather: weatherTool,
      qrcode: qrcodeTool,
    },
    // 启用多步工具调用，允许模型根据工具结果继续处理
    experimental_activeTools: ["weather","qrcode"],
  });

  return result.toUIMessageStreamResponse();
}
