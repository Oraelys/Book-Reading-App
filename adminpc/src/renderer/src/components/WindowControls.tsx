import { api } from '../lib/bridge'

/** The window is frameless, so these three dots are the real close / minimise / maximise controls. */
export function WindowControls() {
  const act = (a: 'close' | 'minimize' | 'maximize') => () => void api.windowControl(a).catch(() => undefined)
  return (
    <div className="wc no-drag" role="group" aria-label="Window controls">
      <button className="wc-dot wc-close" onClick={act('close')} aria-label="Close window" title="Close" />
      <button className="wc-dot wc-min" onClick={act('minimize')} aria-label="Minimise window" title="Minimise" />
      <button className="wc-dot wc-max" onClick={act('maximize')} aria-label="Maximise or restore window" title="Maximise" />
    </div>
  )
}
