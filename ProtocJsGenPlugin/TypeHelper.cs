using Google.Protobuf.Reflection;
using System.Linq;

namespace ProtocJsGenPlugin;

internal static class TypeHelper
{
    public static string GetJsType(FieldDescriptorProto field, FileDescriptorProto protoFile)
    {
        var baseType = GetBaseJsType(field, protoFile);

        // 处理repeated字段（数组）
        if (field.Label == FieldDescriptorProto.Types.Label.Repeated)
        {
            // 检查是否是map（proto中的map会被表示为repeated的特定消息类型）
            if (IsMapField(field))
            {
                var mapTypes = GetMapKeyValueTypes(field);
                return $"Map<{mapTypes.keyType}, {mapTypes.valueType}>";
            }
            else
            {
                return $"{baseType}[]";
            }
        }

        // 处理optional字段（proto3中所有字段都是可选的，但我们可以标记为可能为null）
        // 对于标量类型，在JS中可以是undefined
        return baseType;
    }

    public static string GetBaseJsType(FieldDescriptorProto field, FileDescriptorProto protoFile)
    {
        switch (field.Type)
        {
            case FieldDescriptorProto.Types.Type.Double:
            case FieldDescriptorProto.Types.Type.Float:
                return "number";

            case FieldDescriptorProto.Types.Type.Int64:
            case FieldDescriptorProto.Types.Type.Uint64:
            case FieldDescriptorProto.Types.Type.Int32:
            case FieldDescriptorProto.Types.Type.Fixed64:
            case FieldDescriptorProto.Types.Type.Fixed32:
            case FieldDescriptorProto.Types.Type.Uint32:
            case FieldDescriptorProto.Types.Type.Sfixed32:
            case FieldDescriptorProto.Types.Type.Sfixed64:
            case FieldDescriptorProto.Types.Type.Sint32:
            case FieldDescriptorProto.Types.Type.Sint64:
                return "number";

            case FieldDescriptorProto.Types.Type.Bool:
                return "boolean";

            case FieldDescriptorProto.Types.Type.String:
                return "string";

            case FieldDescriptorProto.Types.Type.Bytes:
                return "Uint8Array";

            case FieldDescriptorProto.Types.Type.Enum:
                return field.TypeName.Split('.').Last();

            case FieldDescriptorProto.Types.Type.Message:
                return GetMessageTypeName(field.TypeName, protoFile);

            default:
                return "any";
        }
    }

    public static bool IsMapField(FieldDescriptorProto field)
    {
        // 简单判断：如果是repeated消息类型，并且类型名包含"Entry"，可能是map
        // 更准确的实现需要检查消息是否有key和value字段
        return field.Type == FieldDescriptorProto.Types.Type.Message &&
               field.Label == FieldDescriptorProto.Types.Label.Repeated &&
               field.TypeName?.Contains("Entry") == true;
    }

    public static (string keyType, string valueType) GetMapKeyValueTypes(FieldDescriptorProto field)
    {
        // 简化实现：返回通用的类型
        // 实际应该解析消息结构获取key和value类型
        return ("string", "any");
    }

    public static string GetMessageTypeName(string typeName, FileDescriptorProto protoFile)
    {
        // 移除开头的"."，因为proto类型名以"."开头表示绝对路径
        if (typeName.StartsWith("."))
            typeName = typeName.Substring(1);

        // 检查是否是当前文件中的嵌套消息
        // 如果类型名包含点（除了包名之外的点），则可能是嵌套消息
        if (!string.IsNullOrEmpty(protoFile.Package) && typeName.StartsWith(protoFile.Package + "."))
        {
            // 去掉包名部分
            string withoutPackage = typeName.Substring(protoFile.Package.Length + 1);
            // 如果去掉包名后仍包含点，说明是嵌套消息
            if (withoutPackage.Contains('.'))
            {
                // 返回独立类名
                return GetIndependentClassName(typeName, protoFile);
            }
        }

        // 返回类型名（简化处理，实际可能需要处理嵌套）
        return typeName.Split('.').Last();
    }

    public static string GetIndependentClassName(string fullTypeName, FileDescriptorProto? protoFile = null)
    {
        // 移除前导点
        if (fullTypeName.StartsWith("."))
            fullTypeName = fullTypeName.Substring(1);

        // 移除包名前缀（如果提供了protoFile）
        if (protoFile != null && !string.IsNullOrEmpty(protoFile.Package) && fullTypeName.StartsWith(protoFile.Package + "."))
        {
            fullTypeName = fullTypeName.Substring(protoFile.Package.Length + 1);
        }

        // 将点替换为下划线
        string className = fullTypeName.Replace('.', '_');

        // 添加前缀以确保不与顶级类名冲突
        return "__" + className;
    }

    public static string GetMethodName(FieldDescriptorProto field)
    {
        return field.Name.SnakeToPascalCase();
    }
}