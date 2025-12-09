#include "type_helper.h"

#include <algorithm>
#include <cctype>
#include <string>

#include "string_extensions.h"

namespace protoc_js_gen_plugin {

namespace {

using google::protobuf::FieldDescriptorProto;
using google::protobuf::FileDescriptorProto;

// Helper to get the last component of a dot-separated string
std::string GetLastComponent(const std::string& str) {
    size_t pos = str.find_last_of('.');
    if (pos == std::string::npos) return str;
    return str.substr(pos + 1);
}

}  // namespace

// Static member initialization
TypeHelper::TypeNameTransformer TypeHelper::type_name_transformer_ = nullptr;

void TypeHelper::SetTypeNameTransformer(TypeNameTransformer transformer) {
    type_name_transformer_ = std::move(transformer);
}

TypeHelper::TypeNameTransformer TypeHelper::GetTypeNameTransformer() {
    return type_name_transformer_;
}

std::string TypeHelper::GetJsType(
    const FieldDescriptorProto& field,
    const FileDescriptorProto& proto_file) {

    std::string base_type = GetBaseJsType(field, proto_file);

    // Handle repeated fields (arrays)
    if (field.label() == FieldDescriptorProto::LABEL_REPEATED) {
        // Check if it's a map field
        if (IsMapField(field)) {
            // JSON serialization doesn't support Map type
            return "any";
        } else {
            return base_type + "[]";
        }
    }

    return base_type;
}

std::string TypeHelper::GetBaseJsType(
    const FieldDescriptorProto& field,
    const FileDescriptorProto& proto_file) {

    switch (field.type()) {
        case FieldDescriptorProto::TYPE_DOUBLE:
        case FieldDescriptorProto::TYPE_FLOAT:
            return "number";

        case FieldDescriptorProto::TYPE_INT64:
        case FieldDescriptorProto::TYPE_UINT64:
        case FieldDescriptorProto::TYPE_INT32:
        case FieldDescriptorProto::TYPE_FIXED64:
        case FieldDescriptorProto::TYPE_FIXED32:
        case FieldDescriptorProto::TYPE_UINT32:
        case FieldDescriptorProto::TYPE_SFIXED32:
        case FieldDescriptorProto::TYPE_SFIXED64:
        case FieldDescriptorProto::TYPE_SINT32:
        case FieldDescriptorProto::TYPE_SINT64:
            return "number";

        case FieldDescriptorProto::TYPE_BOOL:
            return "boolean";

        case FieldDescriptorProto::TYPE_STRING:
            return "string";

        case FieldDescriptorProto::TYPE_BYTES:
            return "Uint8Array";

        case FieldDescriptorProto::TYPE_ENUM:
            if (type_name_transformer_) {
                std::string transformed = type_name_transformer_(field.type_name(), proto_file);
                if (!transformed.empty()) {
                    return transformed;
                }
            }
            return GetLastComponent(field.type_name());

        case FieldDescriptorProto::TYPE_MESSAGE:
            if (type_name_transformer_) {
                std::string transformed = type_name_transformer_(field.type_name(), proto_file);
                if (!transformed.empty()) {
                    return transformed;
                }
            }
            return GetMessageTypeName(field.type_name(), proto_file);

        default:
            return "any";
    }
}

bool TypeHelper::IsMapField(const FieldDescriptorProto& field) {
    // Simple check: if it's a repeated message type and type name contains "Entry"
    return field.type() == FieldDescriptorProto::TYPE_MESSAGE &&
           field.label() == FieldDescriptorProto::LABEL_REPEATED &&
           field.type_name().find("Entry") != std::string::npos;
}

std::pair<std::string, std::string> TypeHelper::GetMapKeyValueTypes(
    const FieldDescriptorProto& field) {
    // Simplified implementation
    return {"string", "any"};
}

std::string TypeHelper::GetMessageTypeName(
    const std::string& type_name,
    const FileDescriptorProto& proto_file) {

    // Remove leading "." if present
    std::string processed_name = type_name;
    if (!processed_name.empty() && processed_name[0] == '.') {
        processed_name = processed_name.substr(1);
    }

    // Check if it's a nested message in the current file
    if (!proto_file.package().empty() &&
        processed_name.find(proto_file.package() + ".") == 0) {

        // Remove package prefix
        std::string without_package = processed_name.substr(proto_file.package().length() + 1);

        // If still contains dots, it's a nested message
        if (without_package.find('.') != std::string::npos) {
            return GetIndependentClassName(type_name, &proto_file);
        }
    }

    return GetLastComponent(processed_name);
}

std::string TypeHelper::GetIndependentClassName(
    const std::string& full_type_name,
    const FileDescriptorProto* proto_file) {

    // Remove leading dot
    std::string processed_name = full_type_name;
    if (!processed_name.empty() && processed_name[0] == '.') {
        processed_name = processed_name.substr(1);
    }

    // Remove package prefix if proto_file is provided
    if (proto_file && !proto_file->package().empty()) {
        std::string package_prefix = proto_file->package() + ".";
        if (processed_name.find(package_prefix) == 0) {
            processed_name = processed_name.substr(package_prefix.length());
        }
    }

    // Replace dots with underscores
    std::string class_name;
    for (char c : processed_name) {
        if (c == '.') {
            class_name += '_';
        } else {
            class_name += c;
        }
    }

    // Add prefix to avoid conflicts with top-level class names
    return "__" + class_name;
}

std::string TypeHelper::GetMethodName(
    const FieldDescriptorProto& field) {

    return SnakeToPascalCase(field.name());
}

}  // namespace protoc_js_gen_plugin