"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { UIMessagePart } from "ai";
import { useState } from "react";

export default function WeatherChat() {
  const [value, setValue] = useState("");
  const { messages, status, sendMessage } = useChat();

  console.log("当前消息:", messages);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50">
      {/* 标题栏 */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">天气查询助手</h1>
        <p className="text-xs text-gray-600 mt-1">
          询问天气，如：北京今天天气如何？
        </p>
      </header>

      {/* 消息展示区域 - 占据剩余空间并可滚动 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8 text-sm">
            开始询问天气吧！
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm transition-all ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
              }`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div
                        key={i}
                        className="whitespace-pre-wrap leading-relaxed"
                      >
                        {part.text}
                      </div>
                    );

                  case "tool-weather":
                    const data = part.output ?? ({} as any);
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="font-semibold text-blue-800">
                          📍 {data?.location} 天气
                        </div>
                        <div className="mt-1 text-sm">
                          <div>
                            温度: {data.temperature}°{data.unit}
                          </div>
                          <div>天气: {data.condition}</div>
                          <div>湿度: {data.humidity}%</div>
                        </div>
                      </div>
                    );
                  case "tool-qrcode":
                    const qrData = part.output ?? ({} as any);
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="font-semibold text-green-800">
                          � QR 码
                        </div>
                        <div className="mt-2">
                          <img
                            src={qrData.imageUrl}
                            alt="QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}

        {/* 加载状态 */}
        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-200">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 输入区域 - 固定在底部 */}
      <footer className="sticky bottom-0 bg-white border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.trim() || status === "streaming") return;

            sendMessage({ text: value });
            setValue("");
          }}
          className="flex gap-2 items-end"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 p-3 border border-gray-300 text-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="输入城市名查询天气..."
            disabled={status === "streaming"}
            enterKeyHint="send" // 移动端键盘显示"发送"
          />
          <button
            type="submit"
            disabled={status === "streaming" || !value.trim()}
            className="px-5 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            {status === "streaming" ? "发送中..." : "发送"}
          </button>
        </form>
      </footer>
    </div>
  );
}
