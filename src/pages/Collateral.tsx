import CollateralApp from '../components/collateral/CollateralApp'
import '../components/collateral/collateral.css'

/** Ported from pauseai.uk's volunteer collateral maker (app/tools/collateral). Fully client-side: nothing leaves the browser. */
export function Collateral() {
  return (
    <div className="collateral-page">
      <h1 className="text-h1">Collateral maker</h1>
      <p className="mt-2 text-lead text-muted-foreground">Make on-brand posts, flyers and event covers. Nothing leaves your browser.</p>
      <CollateralApp events={[]} />
    </div>
  )
}
