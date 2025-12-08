using Google.Protobuf;
using Google.Protobuf.Compiler;
using Google.Protobuf.Reflection;
using System.IO;
using System.Linq;

namespace ProtocJsGenPlugin;

internal static class RequestProcessor
{
    public static CodeGeneratorResponse ProcessRequest(CodeGeneratorRequest request)
    {
        var response = new CodeGeneratorResponse();

        foreach (var protoFile in request.ProtoFile)
        {
            // 只处理用户请求的文件，而不是所有依赖
            if (!request.FileToGenerate.Contains(protoFile.Name))
                continue;

            var fileContent = GenerateFileContent(protoFile);

            response.File.Add(new CodeGeneratorResponse.Types.File
            {
                Name = GetOutputFileName(protoFile.Name),
                Content = fileContent
            });
        }

        return response;
    }

    public static string GetOutputFileName(string protoFileName)
    {
        // 将.proto扩展名替换为.mjs
        return Path.ChangeExtension(protoFileName, ".mjs");
    }

    public static string GenerateFileContent(FileDescriptorProto protoFile)
    {
        var generator = new JsCodeGenerator(protoFile);
        return generator.Generate();
    }
}