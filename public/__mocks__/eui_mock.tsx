/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type Props = Record<string, unknown> & { children?: React.ReactNode; 'data-test-subj'?: string };

const stub =
  (name: string): React.FC<Props> =>
  ({ children, 'data-test-subj': testSubj }) =>
    (
      <div data-eui={name} data-test-subj={testSubj}>
        {children}
      </div>
    );

export const EuiPage = stub('EuiPage');
export const EuiPageBody = stub('EuiPageBody');
export const EuiPageHeader: React.FC<
  Props & { pageTitle?: React.ReactNode; description?: React.ReactNode; rightSideItems?: React.ReactNode[] }
> = ({ children, pageTitle, description, rightSideItems, 'data-test-subj': testSubj }) => (
  <div data-eui="EuiPageHeader" data-test-subj={testSubj}>
    {pageTitle && <h1>{pageTitle}</h1>}
    {description && <p>{description}</p>}
    {rightSideItems?.map((item, i) => <div key={i}>{item}</div>)}
    {children}
  </div>
);
export const EuiTitle = stub('EuiTitle');
export const EuiSpacer = stub('EuiSpacer');
export const EuiFlexGroup = stub('EuiFlexGroup');
export const EuiFlexItem = stub('EuiFlexItem');
export const EuiPanel = stub('EuiPanel');
export const EuiText = stub('EuiText');
export const EuiFieldText = stub('EuiFieldText');
export const EuiTextArea = stub('EuiTextArea');
export const EuiFormRow: React.FC<Props & { label?: React.ReactNode }> = ({
  children,
  label,
  'data-test-subj': testSubj,
}) => (
  <div data-eui="EuiFormRow" data-test-subj={testSubj}>
    {label && <label>{label}</label>}
    {children}
  </div>
);
export const EuiButton: React.FC<
  Props & { onClick?: () => void; disabled?: boolean; fill?: boolean }
> = ({ children, onClick, 'data-test-subj': testSubj }) => (
  <button data-eui="EuiButton" data-test-subj={testSubj} onClick={onClick}>
    {children}
  </button>
);
export const EuiButtonEmpty: React.FC<Props & { onClick?: () => void }> = ({
  children,
  onClick,
  'data-test-subj': testSubj,
}) => (
  <button data-eui="EuiButtonEmpty" data-test-subj={testSubj} onClick={onClick}>
    {children}
  </button>
);
export const EuiButtonIcon: React.FC<Props & { onClick?: () => void }> = ({
  children,
  onClick,
  'data-test-subj': testSubj,
}) => (
  <button data-eui="EuiButtonIcon" data-test-subj={testSubj} onClick={onClick}>
    {children}
  </button>
);
export const EuiEmptyPrompt: React.FC<
  Props & {
    title?: React.ReactNode;
    body?: React.ReactNode;
    actions?: React.ReactNode;
    iconType?: string;
  }
> = ({ title, body, actions, 'data-test-subj': testSubj }) => (
  <div data-eui="EuiEmptyPrompt" data-test-subj={testSubj}>
    {title}
    {body}
    {actions}
  </div>
);
export const EuiBasicTable: React.FC<
  Props & { items?: unknown[]; columns?: unknown[]; loading?: boolean; itemId?: string }
> = ({ items = [], columns = [], loading, 'data-test-subj': testSubj }) => (
  <table data-eui="EuiBasicTable" data-test-subj={testSubj} data-loading={loading}>
    <tbody>
      {(items as any[]).map((item, i) => (
        <tr key={item?.id ?? i}>
          {(columns as any[]).map((col: any, ci: number) => {
            const val = col.field ? item?.[col.field] : undefined;
            let cellContent: React.ReactNode = val ?? '';
            try {
              if (typeof col.render === 'function') cellContent = col.render(val, item);
            } catch {
              /* ok */
            }
            return <td key={col.field ?? ci}>{cellContent}</td>;
          })}
        </tr>
      ))}
    </tbody>
  </table>
);
export const EuiConfirmModal: React.FC<
  Props & {
    title?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    buttonColor?: string;
    defaultFocusedButton?: string;
  }
> = ({
  children,
  title,
  onConfirm,
  onCancel,
  confirmButtonText,
  cancelButtonText,
  'data-test-subj': testSubj,
}) => (
  <div data-eui="EuiConfirmModal" data-test-subj={testSubj}>
    {title && <div>{title}</div>}
    {children}
    {cancelButtonText && <button onClick={onCancel}>{cancelButtonText}</button>}
    {confirmButtonText && <button onClick={onConfirm}>{confirmButtonText}</button>}
  </div>
);
