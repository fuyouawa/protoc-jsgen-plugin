using System.Text;

namespace ProtocJsGenPlugin;

internal static class StringExtensions
{
    /// <summary>
    /// 将snake_case转换为camelCase
    /// </summary>
    public static string SnakeToCamelCase(this string snakeCase)
    {
        if (string.IsNullOrEmpty(snakeCase))
            return snakeCase;

        var parts = snakeCase.Split('_');
        var result = new StringBuilder();

        for (int i = 0; i < parts.Length; i++)
        {
            var part = parts[i];
            if (string.IsNullOrEmpty(part))
                continue;

            if (i == 0)
            {
                // 第一个单词保持小写
                result.Append(part);
            }
            else
            {
                // 后续单词首字母大写
                result.Append(char.ToUpperInvariant(part[0]));
                if (part.Length > 1)
                    result.Append(part.Substring(1));
            }
        }

        return result.ToString();
    }

    /// <summary>
    /// 将snake_case转换为PascalCase
    /// </summary>
    public static string SnakeToPascalCase(this string snakeCase)
    {
        if (string.IsNullOrEmpty(snakeCase))
            return snakeCase;

        var parts = snakeCase.Split('_');
        var result = new StringBuilder();

        foreach (var part in parts)
        {
            if (string.IsNullOrEmpty(part))
                continue;

            result.Append(char.ToUpperInvariant(part[0]));
            if (part.Length > 1)
                result.Append(part.Substring(1));
        }

        return result.ToString();
    }
}