// The Connect handler implementation was removed when protobuf/Connect
// support was deprecated. We retain a small stub that exports a
// mountDiagramsConnectHandler() function which returns false to indicate
// no handler was mounted. This keeps any existing imports stable while
// ensuring the Connect runtime is not required.
import type { Application } from 'express';

export function mountDiagramsConnectHandler(_app: Application) {
  console.warn('mountDiagramsConnectHandler: deprecated — protobuf/Connect support removed');
  return false;
}
