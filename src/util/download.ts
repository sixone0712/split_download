import axios from "axios";
import axiosRetry from "axios-retry";

const client = axios.create();

client.defaults.withCredentials = false;
client.defaults.baseURL = "http://localhost";
client.defaults.responseType = "blob";
client.defaults.headers.common = {
  "Accept-Ranges": "bytes",
};

axiosRetry(client, {
  retries: 10,
  // retryDelay: (retryCount) => 100,
});

export const getfileInfo = async (url: string) => {
  const { headers } = await client(url, {
    headers: {
      Range: "bytes=0-0",
    },
  });
  console.log("headers", headers);

  const size = headers["content-range"]
    ? +headers["content-range"].split("/")[1]
    : 0;

  if (!size) {
    throw Error("file size is 0.");
  }

  return {
    name: getFileName(headers["content-disposition"]),
    size,
    type: headers["content-type"],
  };
};

export const getFileChunk = async ({
  url,
  start,
  chuck,
}: {
  url: string;
  start: number;
  chuck: number;
}) => {
  const { data, headers } = await client(url, {
    method: "GET",
    headers: {
      Range: `bytes=${start}-${start + chuck - 1}`,
    },
  });

  return {
    data,
    length: +headers["content-length"],
  };
};

export async function* generatorChuck({
  url,
  fileSize,
  chunkSize,
}: {
  url: string;
  fileSize: number;
  chunkSize: number;
}) {
  let dnSize = 0;
  console.log(
    "generatorChuck",
    "url",
    url,
    "fileSize",
    fileSize,
    "chunkSize",
    chunkSize
  );
  while (1) {
    try {
      const { data, length } = await getFileChunk({
        url,
        start: dnSize,
        chuck: chunkSize,
      });

      dnSize += length;
      console.log("generatorChuck", "dnSize", dnSize);

      yield { data, length };

      if (dnSize >= fileSize) {
        return;
      }
    } catch (e) {
      console.log("error!!!");
      return;
    }
  }
}

export const getFileName = (disposition: string): string => {
  const fileMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (Array.isArray(fileMatch)) {
    return decodeURI(fileMatch[1].replace(/['"]/g, ""));
  }

  return "download_file";
};
