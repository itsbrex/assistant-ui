import { AppendMessage } from "@assistant-ui/react";
import {
  CreateUIMessage,
  FileUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
} from "ai";

export const toCreateMessage = async (
  message: AppendMessage,
): Promise<CreateUIMessage<UIMessage>> => {
  const textParts = message.content
    .filter((part) => part.type === "text")
    .map((t) => t.text)
    .join("\n\n");

  const parts: UIMessagePart<UIDataTypes, UITools>[] = [
    {
      type: "text",
      text: textParts,
    },
  ];

  // Add image parts
  const imageParts = message.content
    .filter((part) => part.type === "image")
    .map(
      (part) =>
        ({
          type: "file",
          mediaType: "image/png", // Default to PNG, could be made more dynamic
          url: part.image,
        }) satisfies FileUIPart,
    );

  parts.push(...imageParts);

  // Add attachment parts
  const attachmentParts = await Promise.all(
    (message.attachments ?? []).map(async (m) => {
      if (m.file == null) throw new Error("Attachment did not contain a file");
      return {
        type: "file",
        mediaType: m.file.type,
        filename: m.file.name,
        url: await getFileDataURL(m.file),
      } satisfies FileUIPart;
    }),
  );

  parts.push(...attachmentParts);

  return {
    role: message.role,
    parts,
  };
};

const getFileDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
