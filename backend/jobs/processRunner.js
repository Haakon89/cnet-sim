export function runSpawnedCommand({
  command,
  args,
  spawnFn,
  options = {},
  onProcess,
  onStdout,
  onStderr,
  onClose,
}) {
  return new Promise((resolve, reject) => {
    const child = spawnFn(command, args, {
      ...options,
      shell: false,
    });

    onProcess?.(child);

    child.stdout.on("data", (data) => {
      const lines = data
        .toString()
        .split(/\r?\n/)
        .filter(Boolean);

      for (const line of lines) {
        onStdout?.(line);
      }
    });

    child.stderr.on("data", (data) => {
      const lines = data
        .toString()
        .split(/\r?\n/)
        .filter(Boolean);

      for (const line of lines) {
        onStderr?.(line);
      }
    });

    child.on("error", reject);

    child.on("close", (code) => {
      onClose?.(code);

      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with code ${code}`
          )
        );
      }
    });
  });
}