#pragma once

#include <functional>
#include <string>

#include "google/protobuf/descriptor.pb.h"

namespace protoc_js_gen_plugin {

class TypeHelper {
public:
    // Type name transformer function type
    using TypeNameTransformer = std::function<std::string(
        const std::string& type_name,
        const google::protobuf::FileDescriptorProto& proto_file)>;

    // Set the type name transformer
    static void SetTypeNameTransformer(TypeNameTransformer transformer);

    // Get the current type name transformer
    static TypeNameTransformer GetTypeNameTransformer();

    // Get JavaScript type for a field
    static std::string GetJsType(
        const google::protobuf::FieldDescriptorProto& field,
        const google::protobuf::FileDescriptorProto& proto_file);

    // Get base JavaScript type (without array notation)
    static std::string GetBaseJsType(
        const google::protobuf::FieldDescriptorProto& field,
        const google::protobuf::FileDescriptorProto& proto_file);

    // Check if a field is a map field
    static bool IsMapField(const google::protobuf::FieldDescriptorProto& field);

    // Get key and value types for a map field
    static std::pair<std::string, std::string> GetMapKeyValueTypes(
        const google::protobuf::FieldDescriptorProto& field);

    // Get message type name (handles nested messages)
    static std::string GetMessageTypeName(
        const std::string& type_name,
        const google::protobuf::FileDescriptorProto& proto_file);

    // Get independent class name for nested messages
    static std::string GetIndependentClassName(
        const std::string& full_type_name,
        const google::protobuf::FileDescriptorProto* proto_file = nullptr);

    // Get method name from field name
    static std::string GetMethodName(
        const google::protobuf::FieldDescriptorProto& field);

private:
    static TypeNameTransformer type_name_transformer_;
};

}  // namespace protoc_js_gen_plugin