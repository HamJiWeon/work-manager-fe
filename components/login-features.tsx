import { Folder } from 'lucide-react'
import styles from './login-page.module.css'

const ACTIVITY_COLORS = ['#f4f2ed', '#f6df9c', '#efa85a', '#d96c38', '#a83e2e']
const ACTIVITY_CELL_COUNT = 112
const ACTIVITY_PATTERN = [0, 1, 0, 2, 1, 3, 0, 1, 2, 4, 2, 1, 3, 0, 2, 1]
const EXAMPLE_COLUMNS = [
  { title: '시작 전', cards: ['화면 구성 정리', 'API 명세 확인'] },
  { title: '진행 중', cards: ['로그인 화면 구현'] },
  { title: '완료', cards: ['프로젝트 초기 설정'] },
]

function PreviewBar() {
  return (
    <div className={styles.previewBar}>
      <div className={styles.windowControls} aria-hidden="true"><i /><i /><i /></div>
    </div>
  )
}

/** 제품 화면을 본뜬 예시와 함께 프로젝트, 카드, 활동 조회 기능을 소개한다. */
export function LoginFeatures() {
  return (
    <div className={styles.features}>
      <section className={styles.feature} aria-labelledby="project-feature">
        <div className={styles.featureInner}>
          <div className={styles.featureVisual} role="img" aria-label="웹 서비스와 앱 리뉴얼 프로젝트를 모아 둔 프로젝트 목록 예시">
            <div className={styles.preview}>
              <PreviewBar />
              <div className={styles.previewBody}>
                <span className={styles.previewLabel}>MY WORKSPACE</span>
                <h3>나의 프로젝트</h3>
                {['웹 서비스 개발', '앱 리뉴얼', '사이드 프로젝트'].map((name, index) => (
                  <div className={styles.projectRow} key={name}>
                    <span className={styles.projectIcon}><Folder size={18} /></span>
                    <div><strong>{name}</strong><small>기획부터 완성까지, 한곳에서</small></div>
                    <span>보드 {index + 2}개</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.featureCopy}>
            <span>01 · PROJECT</span>
            <h2 id="project-feature">흩어져 있던 일들을<br />하나의 프로젝트로.</h2>
          </div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="card-feature">
        <div className={styles.featureInner}>
          <div className={styles.featureVisual} role="img" aria-label="시작 전, 진행 중, 완료 상태로 카드를 나눈 작업 보드 예시">
            <div className={styles.preview}>
              <PreviewBar />
              <div className={styles.previewBody}>
                <span className={styles.previewLabel}>WEB SERVICE</span>
                <h3>작업 보드</h3>
                <div className={styles.columns}>
                  {EXAMPLE_COLUMNS.map(column => <div className={styles.column} key={column.title}>
                    <span>{column.title} · {column.cards.length}</span>
                    {column.cards.map(card => <div className={styles.sampleCard} key={card}><strong>{card}</strong><small>웹 서비스 개발</small></div>)}
                  </div>)}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.featureCopy}>
            <span>02 · CARD</span>
            <h2 id="card-feature">막연했던 할 일을<br />하나씩, 차근차근.</h2>
          </div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="activity-feature">
        <div className={styles.featureInner}>
          <div className={styles.featureVisual} role="img" aria-label="날짜별 완료한 작업을 색상으로 보여주는 활동 기록 예시">
            <div className={styles.preview}>
              <PreviewBar />
              <div className={styles.previewBody}>
                <span className={styles.previewLabel}>YOUR PROGRESS</span>
                <h3>작업 현황</h3>
                <p className={styles.activitySummary}>차곡차곡 쌓인 <strong>128</strong>개의 완료</p>
                <div className={styles.activityGrid}>
                  {Array.from({ length: ACTIVITY_CELL_COUNT }, (_, index) => <span key={index} style={{ background: ACTIVITY_COLORS[ACTIVITY_PATTERN[(index + Math.floor(index / ACTIVITY_PATTERN.length)) % ACTIVITY_PATTERN.length]] }} />)}
                </div>
                <div className={styles.activityCaption}><span>매일의 작은 완료를 기록해요</span><span>적음 ··· 많음</span></div>
              </div>
            </div>
          </div>
          <div className={styles.featureCopy}>
            <span>03 · ACTIVITY</span>
            <h2 id="activity-feature">작은 완료가 쌓여<br />눈에 보이는 변화로.</h2>
          </div>
        </div>
      </section>
    </div>
  )
}
