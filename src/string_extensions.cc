#include "string_extensions.h"

#include <cctype>
#include <sstream>
#include <string>
#include <vector>

namespace protoc_js_gen_plugin {
namespace {

std::vector<std::string> SplitString(const std::string& str, char delimiter) {
    std::vector<std::string> parts;
    std::stringstream ss(str);
    std::string part;
    while (std::getline(ss, part, delimiter)) {
        parts.push_back(part);
    }
    return parts;
}

}  // namespace

std::string SnakeToCamelCase(const std::string& snake_case) {
    if (snake_case.empty()) return snake_case;

    auto parts = SplitString(snake_case, '_');
    std::string result;

    for (size_t i = 0; i < parts.size(); ++i) {
        const auto& part = parts[i];
        if (part.empty()) continue;

        if (i == 0) {
            // First word stays lowercase
            result += part;
        } else {
            // Subsequent words start with uppercase
            result += static_cast<char>(std::toupper(static_cast<unsigned char>(part[0])));
            if (part.size() > 1) {
                result += part.substr(1);
            }
        }
    }

    return result;
}

std::string SnakeToPascalCase(const std::string& snake_case) {
    if (snake_case.empty()) return snake_case;

    auto parts = SplitString(snake_case, '_');
    std::string result;

    for (const auto& part : parts) {
        if (part.empty()) continue;

        result += static_cast<char>(std::toupper(static_cast<unsigned char>(part[0])));
        if (part.size() > 1) {
            result += part.substr(1);
        }
    }

    return result;
}

}  // namespace protoc_js_gen_plugin