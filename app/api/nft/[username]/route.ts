import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import svg from "@/app/shared/svg";

type Params = {
  params: {
    username: string;
  };
};

function trauncate(username: string) {
  if (username.length <= 36) return username;
  return `${username.slice(0, 20)}....${username.slice(-13)}`;
}

export async function GET(_: NextRequest, { params }: Params) {
  let { username } = params;

  const len = username.length - 3;
  if (len < 1)
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  username = trauncate(username);

  let content = svg;
  content = content.replace("[[USERNAME]]", username);
  content = content.replace("[[LENGTH]]", String(len + 3));

  const canvas = createCanvas(500, 499);
  const ctx = canvas.getContext("2d");

  const image = await loadImage(
    `data:image/svg+xml;base64,${Buffer.from(content).toString("base64")}`
  );

  ctx.drawImage(image, 0, 0);
  const buffer = canvas.toBuffer("image/png");

  const response = new NextResponse(buffer, {
    status: 200,
    headers: {
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Content-Type": "image/png",
    },
  });

  return response;
}
