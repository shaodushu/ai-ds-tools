"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useState } from "react";

// 授信状态表单组件
function CreditStatusForm({ customerId, onSubmit }: { 
  customerId: string; 
  onSubmit: (status: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  
  return (
    <div className="mt-3 p-3 bg-white rounded-lg border space-y-3">
      <div className="text-sm font-medium text-gray-700">
        请补充客户 <span className="font-mono bg-gray-100 px-1 rounded">{customerId}</span> 的授信状态：
      </div>
      <div className="space-y-2">
        {['已授信', '未授信', '授信未提现', '已提现'].map(status => (
          <label key={status} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
            <input
              type="radio"
              value={status}
              checked={selectedStatus === status}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm">{status}</span>
          </label>
        ))}
      </div>
      <button
        onClick={() => selectedStatus && onSubmit(selectedStatus)}
        disabled={!selectedStatus}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        确认并重新查询
      </button>
    </div>
  );
}

export default function WeatherChat() {
  const [value, setValue] = useState("");
  const { messages, status, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">智能查询助手</h1>
        <p className="text-xs text-gray-600 mt-1">
          支持天气查询、二维码生成和客户信息查询（含授信状态补充）
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8 text-sm">
            开始查询！输入"查询客户 CREDIT-001"测试授信场景
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
                    return <div key={i} className="whitespace-pre-wrap">{part.text}</div>;

                  case "tool-weather":
                    const data = part.output ?? {};
                    return (
                      <div key={part.toolCallId} className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-800">📍 {data.location} 天气</div>
                        <div className="mt-1 text-sm space-y-1">
                          <div>温度: {data.temperature}°{data.unit}</div>
                          <div>天气: {data.condition}</div>
                          <div>湿度: {data.humidity}%</div>
                        </div>
                      </div>
                    );

                  case "tool-qrcode":
                    const qrData = part.output ?? {};
                    return (
                      <div key={part.toolCallId} className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-semibold text-green-800">📱 QR 码</div>
                        <img src={qrData.imageUrl} alt="QR Code" className="w-32 h-32 mt-2" />
                      </div>
                    );

                  case "tool-customer":
                    const customerData = part.output ?? {};
                    
                    // 字段缺失校验：渲染补充表单
                    if (customerData.__incomplete__ && customerData.requiredComponent === "credit-status-form") {
                      return (
                        <div key={part.toolCallId} className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="font-semibold text-yellow-800 mb-2">⚠️ 信息不完整</div>
                          <div className="text-sm text-gray-700 mb-3">{customerData.message}</div>
                          <CreditStatusForm 
                            customerId={customerData.customerId}
                            onSubmit={(status) => {
                              // 发送补充后的查询，触发重新调用工具
                              sendMessage({ 
                                text: `查询客户 ${customerData.customerId}，授信状态：${status}` 
                              });
                            }}
                          />
                        </div>
                      );
                    }
                    
                    // 字段完整：正常渲染客户信息卡片
                    const queryTime = new Date(customerData.queryTime).toLocaleString('zh-CN');
                    return (
                      <div key={part.toolCallId} className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="font-semibold text-purple-800 mb-2">👤 客户信息查询结果</div>
                        <div className="text-sm space-y-1">
                          <div><span className="font-medium">客户ID:</span> {customerData.customerId}</div>
                          <div><span className="font-medium">查询时间:</span> {queryTime}</div>
                          <div>
                            <span className="font-medium">状态:</span> 
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              customerData.status === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                              customerData.status === '活跃' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>{customerData.status}</span>
                          </div>
                          {customerData.customerName && (
                            <div><span className="font-medium">客户名称:</span> {customerData.customerName}</div>
                          )}
                          {customerData.creditStatus && (
                            <>
                              <div>
                                <span className="font-medium">授信状态:</span> 
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                  customerData.creditStatus === '授信未提现' ? 'bg-purple-100 text-purple-800' :
                                  customerData.creditStatus === '已授信' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{customerData.creditStatus}</span>
                              </div>
                              {customerData.creditAmount > 0 && (
                                <div><span className="font-medium">授信额度:</span> ¥{customerData.creditAmount.toLocaleString()}</div>
                              )}
                            </>
                          )}
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

        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl border">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </main>

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
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="输入查询内容..."
            disabled={status === "streaming"}
          />
          <button
            type="submit"
            disabled={status === "streaming" || !value.trim()}
            className="px-5 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
          >
            {status === "streaming" ? "发送中..." : "发送"}
          </button>
        </form>
      </footer>
    </div>
  );
}