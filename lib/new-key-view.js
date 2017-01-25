'use babel'

/** @jsx etch.dom */

import etch from 'etch'
const { Disposable, CompositeDisposable, TextEditor } = require('atom')

export default class NewKeyView {
  constructor(props) {
    this.props = props
    etch.initialize(this)
    this.refs.keyName.setText(props.keyName)
    this.disposables = new CompositeDisposable()
    this.disposables.add(global.atom.commands.add(this.element, {
      'core:confirm': (event) => {
        this.confirm()
        event.stopPropagation()
      },
      'core:cancel': (event) => {
        this.cancel()
        event.stopPropagation()
      },
    }))

    this.confirm = this.confirm.bind(this)
    this.cancel = this.cancel.bind(this)
    this.refs.keyName.element.addEventListener('blur', this.cancel)
    this.disposables.add(new Disposable(() => { this.refs.keyName.element.removeEventListener('blur', this.cancel) }))
  }

  render() {
    return (
      <div>
        <TextEditor ref="keyName" mini />
        <span className="error-message">Enter key name</span>
      </div>
    )
  }

  focus() {
    this.refs.keyName.element.focus()
  }

  confirm() {
    this.props.onConfirm(this.refs.keyName.getText())
  }

  cancel() {
    if (this.props.onCancel) {
      this.props.onCancel()
    }
  }

  update() {
    return etch.update(this)
  }

  destroy() {
    return etch.destroy(this)
  }
}
