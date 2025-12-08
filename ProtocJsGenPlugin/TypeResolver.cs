using Google.Protobuf.Reflection;
using System.Collections.Generic;
using System.Linq;

namespace ProtocJsGenPlugin;

internal class TypeResolver
{
    // 类型全名 -> (proto文件名, 类型简单名)
    private readonly Dictionary<string, (string protoFile, string simpleName)> _typeMap = new();
    // 当前处理的proto文件
    private readonly FileDescriptorProto _currentFile;
    // 所有proto文件列表
    private readonly IReadOnlyList<FileDescriptorProto> _allProtoFiles;

    public TypeResolver(FileDescriptorProto currentFile, IReadOnlyList<FileDescriptorProto> allProtoFiles)
    {
        _currentFile = currentFile;
        _allProtoFiles = allProtoFiles;
        BuildTypeMap();
    }

    private void BuildTypeMap()
    {
        foreach (var protoFile in _allProtoFiles)
        {
            // 处理消息类型
            foreach (var message in protoFile.MessageType)
            {
                RegisterMessage(message, protoFile);
            }
            // 处理枚举类型
            foreach (var enumType in protoFile.EnumType)
            {
                RegisterEnum(enumType, protoFile);
            }
        }
    }

    private void RegisterMessage(DescriptorProto message, FileDescriptorProto protoFile, string parentFullName = "")
    {
        var fullName = GetFullName(message.Name, protoFile.Package, parentFullName);
        var simpleName = message.Name;
        _typeMap[fullName] = (protoFile.Name, simpleName);

        // 递归处理嵌套消息
        foreach (var nestedMessage in message.NestedType)
        {
            RegisterMessage(nestedMessage, protoFile, fullName);
        }

        // 处理嵌套枚举
        foreach (var nestedEnum in message.EnumType)
        {
            RegisterEnum(nestedEnum, protoFile, fullName);
        }
    }

    private void RegisterEnum(EnumDescriptorProto enumType, FileDescriptorProto protoFile, string parentFullName = "")
    {
        var fullName = GetFullName(enumType.Name, protoFile.Package, parentFullName);
        var simpleName = enumType.Name;
        _typeMap[fullName] = (protoFile.Name, simpleName);
    }

    private static string GetFullName(string name, string package, string parentFullName)
    {
        // 构建完整的类型名（以点开头）
        if (!string.IsNullOrEmpty(parentFullName))
        {
            return parentFullName + "." + name;
        }
        else if (!string.IsNullOrEmpty(package))
        {
            return "." + package + "." + name;
        }
        else
        {
            return "." + name;
        }
    }

    /// <summary>
    /// 获取类型信息，如果是外部类型则返回导入信息
    /// </summary>
    /// <param name="typeName">完整类型名（可能以点开头）</param>
    /// <returns>如果是外部类型，返回(proto文件名, 类型简单名)；否则返回null</returns>
    public (string protoFile, string simpleName)? GetExternalTypeInfo(string typeName)
    {
        // 规范化类型名：确保以点开头
        if (!typeName.StartsWith("."))
            typeName = "." + typeName;

        if (_typeMap.TryGetValue(typeName, out var info))
        {
            // 检查是否来自当前文件
            if (info.protoFile == _currentFile.Name)
                return null;

            return info;
        }

        // 未找到类型，可能是基础类型或错误
        return null;
    }

    /// <summary>
    /// 获取需要导入的类型列表（去重）
    /// </summary>
    /// <param name="referencedTypeNames">引用的类型名列表</param>
    /// <returns>需要导入的(proto文件名, 类型简单名)列表</returns>
    public List<(string protoFile, string simpleName)> GetRequiredImports(IEnumerable<string> referencedTypeNames)
    {
        var imports = new HashSet<(string protoFile, string simpleName)>();
        foreach (var typeName in referencedTypeNames)
        {
            var info = GetExternalTypeInfo(typeName);
            if (info.HasValue)
            {
                imports.Add(info.Value);
            }
        }
        return imports.ToList();
    }
}