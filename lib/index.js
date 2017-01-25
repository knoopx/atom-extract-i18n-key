'use babel'

import fs from 'fs'
import path from 'path'
import NewKeyView from './new-key-view'
import { CompositeDisposable } from 'atom'
const { allowUnsafeNewFunction } = require('loophole')

const RULES_FILE = '.atom-i18n.js'
export default {
  rules: [],
  modalPanel: null,
  subscriptions: new CompositeDisposable(),

  activate(state) {
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-extract-i18n-key:new-key': this.showNewKeyModal.bind(this),
    }))

    atom.project.getPaths().forEach((projectPath) => {
      const rulesPath = path.join(projectPath, RULES_FILE)
      if (fs.existsSync(rulesPath)) {
        allowUnsafeNewFunction(() => {
          this.rules = require(rulesPath)
        })
      }
    })

    if (Object.keys(this.rules).length === 0) {
      atom.notifications.addError(`No i18n rules found. Please define some in ${RULES_FILE}`)
    }
  },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
  },

  confirm(keyName, filePath) {
    if (keyName.length > 0) {
      const ruleKey = Object.keys(this.rules).filter((pattern) => {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(filePath)) {
          return true
        }
        return false
      })

      if (ruleKey) {
        this.modalPanel.destroy()

        const rule = this.rules[ruleKey]

        const editor = atom.workspace.getActiveTextEditor()

        allowUnsafeNewFunction(() => {
          const replacement = rule(keyName, editor.getSelectedText())

          editor.mutateSelectedText((selection) => {
            selection.delete()
            selection.insertText(replacement)
          })
        })
      }
    }
  },

  cancel() {
    this.modalPanel.destroy()
  },

  getKeyNamespace(filePath) {
    const { name } = path.parse(filePath)
    let dirname = path.dirname(filePath)
    atom.project.getPaths().forEach((projectPath) => {
      dirname = dirname.replace(new RegExp(`^${projectPath}/?`), '')
    })
    return [...dirname.split('/'), name].join('.')
  },

  showNewKeyModal() {
    const editor = atom.workspace.getActiveTextEditor()
    const filePath = editor.buffer.file.getPath()
    const view = new NewKeyView({
      keyName: `${this.getKeyNamespace(filePath)}.`,
      onConfirm: keyName => this.confirm(keyName, filePath),
      onCancel: this.cancel.bind(this),
    })

    this.modalPanel = atom.workspace.addModalPanel({
      item: view,
      visible: true,
    })

    view.focus()
  },
}
