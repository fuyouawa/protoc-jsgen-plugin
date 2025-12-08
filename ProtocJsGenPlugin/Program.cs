using Google.Protobuf;
using Google.Protobuf.Compiler;

namespace ProtocJsGenPlugin;

class Program
{
    static void Main(string[] args)
    {
        // 从stdin读取整个请求数据
        using var stdin = Console.OpenStandardInput();
        using var stdout = Console.OpenStandardOutput();

        // 读取请求
        var request = CodeGeneratorRequest.Parser.ParseFrom(stdin);

        // 处理请求并生成响应
        var response = RequestProcessor.ProcessRequest(request);

        // 写入响应到stdout
        response.WriteTo(stdout);
    }
}

